import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "../app/sitemap";
import robots from "../app/robots";
import { getAllWallpapers, paginateWallpapers } from "../lib/archive";
import { locales } from "../lib/i18n";
import { pageMetadata, serializeJsonLd, siteUrl } from "../lib/seo";

test("canonical and reciprocal language URLs preserve pagination", () => {
  const metadata = pageMetadata({ locale: "zh", path: "?page=2", title: "壁纸", description: "测试" });
  assert.equal(metadata.alternates?.canonical, siteUrl("/zh?page=2"));
  assert.equal(metadata.alternates?.languages?.en, siteUrl("/en?page=2"));
  assert.equal(metadata.alternates?.languages?.["x-default"], siteUrl("/en?page=2"));
  assert.equal(metadata.openGraph?.url, metadata.alternates?.canonical);
});

test("filtered archives can be excluded while links remain crawlable", () => {
  const metadata = pageMetadata({ locale: "en", title: "Search", description: "test", noIndex: true });
  assert.deepEqual(metadata.robots, {
    index: false, follow: true,
    googleBot: { index: false, follow: true, "max-image-preview": "large" },
  });
});

test("sitemap covers every locale, wallpaper and archive page without duplicates", () => {
  const entries = sitemap();
  const expectedCount = locales.reduce((total, locale) => {
    const wallpapers = getAllWallpapers(locale);
    return total + wallpapers.length + paginateWallpapers(wallpapers, 1).totalPages + 1;
  }, 0);
  assert.equal(entries.length, expectedCount);
  assert.equal(new Set(entries.map((entry) => entry.url)).size, entries.length);
  for (const locale of locales) {
    for (const wallpaper of getAllWallpapers(locale)) {
      const url = siteUrl(`/${locale}/wallpaper/${wallpaper.Ssd}`);
      const entry = entries.find((entry) => entry.url === url);
      assert.ok(entry, url);
      for (const [language, alternateUrl] of Object.entries(entry.alternates?.languages ?? {})) {
        assert.ok(entries.some((candidate) => candidate.url === alternateUrl), language);
      }
    }
  }
  assert.equal(robots().sitemap, siteUrl("/sitemap.xml"));
});

test("archive text cannot terminate a JSON-LD script element", () => {
  const input = { description: '</script><script>alert("x")</script>' };
  const output = serializeJsonLd(input);
  assert.equal(output.includes("<"), false);
  assert.deepEqual(JSON.parse(output), input);
});
