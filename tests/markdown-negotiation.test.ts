import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { GET } from "../app/api/markdown/[locale]/[[...page]]/route";
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
