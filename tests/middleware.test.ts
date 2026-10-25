import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";

const origin = "https://bing.xc2f.com";

test("language prefetches preserve the saved language and root redirect", () => {
  for (const headers of [
    { "next-router-prefetch": "1" },
    { purpose: "prefetch" },
    { "sec-purpose": "prefetch;prerender" },
  ]) {
    const requestHeaders = new Headers(headers);
    requestHeaders.set("cookie", "preferred-locale=zh");

    for (const path of ["/es", "/es/wallpaper/20260512", "/", "/wallpaper/20260512"]) {
      const response = middleware(new NextRequest(`${origin}${path}`, {
        headers: requestHeaders,
      }));
      assert.equal(response.headers.get("set-cookie"), null, path);
    }

    const revisit = middleware(new NextRequest(`${origin}/`, {
      headers: requestHeaders,
    }));
    assert.equal(revisit.headers.get("location"), `${origin}/zh`);
  }
});

test("opening a language page remembers the explicit language choice", () => {
  const response = middleware(new NextRequest(`${origin}/es`, {
    headers: { cookie: "preferred-locale=zh" },
  }));
  const cookie = response.cookies.get("preferred-locale");
  assert.equal(cookie?.value, "es");

  const revisit = middleware(new NextRequest(`${origin}/`, {
    headers: { cookie: `preferred-locale=${cookie?.value}` },
  }));
  assert.equal(revisit.headers.get("location"), `${origin}/es`);
});

test("first visits use the browser language and preserve the query string", () => {
  const response = middleware(new NextRequest(`${origin}/?year=2026`, {
    headers: { "accept-language": "zh-CN,zh;q=0.9,en;q=0.8" },
  }));
  assert.equal(response.headers.get("location"), `${origin}/zh?year=2026`);
  assert.equal(response.cookies.get("preferred-locale")?.value, "zh");
});
