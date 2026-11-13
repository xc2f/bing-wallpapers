import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "../app/sitemap";
import { GET as getRobots } from "../app/robots.txt/route";
import { getAllWallpapers } from "../lib/archive";
import { locales } from "../lib/i18n";
import { pageMetadata, serializeJsonLd, siteUrl } from "../lib/seo";

test("canonical and reciprocal language URLs point to the unified homepage", () => {
  const metadata = pageMetadata({ locale: "zh", title: "壁纸", description: "测试" });
  assert.equal(metadata.alternates?.canonical, siteUrl("/zh"));
  assert.equal(metadata.alternates?.languages?.en, siteUrl("/en"));
  assert.equal(metadata.alternates?.languages?.["x-default"], siteUrl("/en"));
  assert.equal(metadata.openGraph?.url, metadata.alternates?.canonical);
});

test("filtered archives can be excluded while links remain crawlable", () => {
  const metadata = pageMetadata({ locale: "en", title: "Search", description: "test", noIndex: true });
  assert.deepEqual(metadata.robots, {
    index: false, follow: true,
    googleBot: { index: false, follow: true, "max-image-preview": "large" },
  });
});

test("sitemap covers every localized gallery, Earth page and wallpaper without duplicates", () => {
  const entries = sitemap();
  const expectedCount = locales.reduce((total, locale) => {
    const wallpapers = getAllWallpapers(locale);
    return total + wallpapers.length + 2;
  }, 0);
  assert.equal(entries.length, expectedCount);
  assert.equal(new Set(entries.map((entry) => entry.url)).size, entries.length);
  assert.ok(entries.every((entry) => !entry.url.includes("?") && !entry.url.includes("/waterfall")));
  for (const locale of locales) {
    assert.ok(entries.some((entry) => entry.url === siteUrl(`/${locale}/earth`)));
    for (const wallpaper of getAllWallpapers(locale)) {
      const url = siteUrl(`/${locale}/wallpaper/${wallpaper.Ssd}`);
      const entry = entries.find((entry) => entry.url === url);
      assert.ok(entry, url);
      for (const [language, alternateUrl] of Object.entries(entry.alternates?.languages ?? {})) {
        assert.ok(entries.some((candidate) => candidate.url === alternateUrl), language);
      }
    }
  }
});

test("robots.txt declares content preferences, allows crawling, and links the sitemap", async () => {
  const response = getRobots();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/plain\b/);
  assert.equal(await response.text(), [
    "User-agent: *",
    "Content-Signal: search=yes, ai-input=yes, ai-train=no",
    "Allow: /",
    "",
    `Sitemap: ${siteUrl("/sitemap.xml")}`,
    "",
  ].join("\n"));
});

test("archive text cannot terminate a JSON-LD script element", () => {
  const input = { description: '</script><script>alert("x")</script>' };
  const output = serializeJsonLd(input);
  assert.equal(output.includes("<"), false);
  assert.deepEqual(JSON.parse(output), input);
});
