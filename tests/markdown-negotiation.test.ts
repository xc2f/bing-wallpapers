import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { GET } from "../app/api/markdown/[locale]/[[...page]]/route";
import { GET as filterOptions } from "../app/api/filters/route";
import { GET as wallpaperJson } from "../app/api/wallpapers/[locale]/[ssd]/route";
import { GET as searchWallpapers } from "../app/api/waterfall/route";
import { GET as wallpaperText } from "../app/[locale]/wallpaper/[ssd]/text/route";
import { config, middleware } from "../middleware";

const origin = "https://bing.xc2f.com";

async function markdown(path: string, language = "en") {
  const request = new NextRequest(origin + path, {
    headers: { accept: "text/markdown", "accept-language": language },
  });
  assert.ok(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: path }));
  const rewritten = middleware(request).headers.get("x-middleware-rewrite");
  assert.ok(rewritten);
  const url = new URL(rewritten);
  const [, api, format, locale, ...page] = url.pathname.split("/");
  assert.deepEqual([api, format], ["api", "markdown"]);
  return GET(new Request(url, { headers: request.headers }), { params: Promise.resolve({ locale, page }) });
}

test("HTML and RSC continue to the page; only explicit Markdown opt-in rewrites", () => {
  const headerCases: HeadersInit[] = [
    {},
    { accept: "text/html" },
    { accept: "*/*" },
    { accept: "text/markdown;q=0, text/html" },
    { accept: "text/markdown", rsc: "1" },
  ];
  for (const headers of headerCases) {
    const response = middleware(new NextRequest(origin + "/en/wallpaper/20241224_0800", { headers }));
    assert.equal(response.headers.get("x-middleware-rewrite"), null);
    assert.match(response.headers.get("vary") ?? "", /\bAccept\b/);
  }
});

test("the root URL negotiates localized Markdown and preserves archive filters", async () => {
  const response = await markdown("/?q=ssd%3A20241224_0800", "zh-CN");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/markdown\b/);
  assert.equal(response.headers.get("content-language"), "zh-CN");
  const body = await response.text();
  assert.match(body, /^# Bing 壁纸档案馆/);
  assert.equal(body.match(/\/zh\/wallpaper\//g)?.length, 1);
  assert.match(body, /20241224/);
});

test("wallpaper Markdown includes source and image; unknown wallpapers return 404", async () => {
  const response = await markdown("/en/wallpaper/20241224_0800");
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /^# .*Freudenberg/);
  assert.match(body, /2024-12-24/);
  assert.match(body, /https:\/\/www\.bing\.com\/th\?/);
  assert.doesNotMatch(body, /<script|<html/i);
  assert.equal((await markdown("/en/wallpaper/unknown")).status, 404);
});

test("Earth Markdown links to the archive filters used by Earth albums", async () => {
  const response = await markdown("/en/earth");
  assert.equal(response.status, 200);
  assert.match(await response.text(), /\/en\?country=/);
});

test("search results link to JSON details and text formats share available details", async () => {
  const locale = "zh";
  const ssd = "20261029";
  const results = await searchWallpapers(new NextRequest(origin + "/api/waterfall?locale=zh&q=ssd%3A20261029"));
  const { items } = await results.json();
  assert.equal(items[0].detailApiHref, `/api/wallpapers/${locale}/${ssd}`);

  const request = new Request(origin + items[0].detailApiHref);
  const params = Promise.resolve({ locale, ssd });
  const detail = await wallpaperJson(request, { params });
  assert.equal(detail.status, 200);
  assert.equal(detail.headers.get("content-language"), "zh-CN");
  const { headline, quickFact, location, bingUrl } = await detail.json();
  assert.equal(headline, "薄雾邂逅千年时光");
  assert.match(quickFact, /埃夫伯里/);
  assert.equal(location.precision, "exact");
  assert.equal(location.points[0].latitude, 51.42898);
  assert.match(location.mapUrl, /^https:\/\/www\.openstreetmap\.org\//);
  assert.match(bingUrl, /^https:\/\/www\.bing\.com\/search\?/);

  const markdownBody = await (await markdown(`/${locale}/wallpaper/${ssd}`)).text();
  const textBody = await (await wallpaperText(request, { params })).text();
  for (const body of [markdownBody, textBody]) {
    for (const value of [headline, quickFact, location.name, location.mapUrl, bingUrl]) {
      assert.ok(body.includes(value));
    }
  }
});

test("localized filter IDs can be used directly in search and approximate coordinates are marked", async () => {
  const options = await filterOptions(new Request(origin + "/api/filters?locale=zh"));
  assert.equal(options.status, 200);
  const { countries } = await options.json();
  const canada = countries.find(({ id }: { id: string }) => id === "CA");
  assert.equal(canada.name, "加拿大");
  assert.ok(canada.count > 0);
  const search = await searchWallpapers(new NextRequest(origin + `/api/waterfall?locale=zh&country=${canada.id}`));
  assert.ok((await search.json()).totalCount > 0);
  const detail = await wallpaperJson(new Request(origin), { params: Promise.resolve({ locale: "zh", ssd: "20261102" }) });
  const { location } = await detail.json();
  assert.equal(location.precision, "country");
  assert.equal(location.mapUrl, undefined);
  assert.equal((await filterOptions(new Request(origin + "/api/filters"))).status, 400);
  assert.equal((await wallpaperJson(new Request(origin), { params: Promise.resolve({ locale: "zh", ssd: "unknown" }) })).status, 404);
});
