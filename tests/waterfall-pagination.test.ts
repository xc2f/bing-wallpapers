import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET } from "../app/api/waterfall/route";
import { getAllWallpapers } from "../lib/archive";
import { WATERFALL_BATCH_SIZE, waterfallPageForIndex, waterfallPageWindow } from "../lib/waterfall-pagination";

test("deep pages select a single batch and preserve global slideshow indices", () => {
  const window = waterfallPageWindow(2000, 10);
  assert.deepEqual(window, { page: 10, totalPages: 12, start: 1620, end: 1800 });
  assert.equal(window.end - window.start, WATERFALL_BATCH_SIZE);
  for (const index of [0, 179, 180, 359, 540, 1999]) {
    const page = waterfallPageForIndex(index);
    const range = waterfallPageWindow(2000, page);
    assert.ok(index >= range.start && index < range.end);
  }
});

test("empty, last and invalid page windows stay bounded", () => {
  assert.deepEqual(waterfallPageWindow(0, 99), { page: 1, totalPages: 1, start: 0, end: 0 });
  assert.deepEqual(waterfallPageWindow(190, 99), { page: 2, totalPages: 2, start: 180, end: 190 });
  for (const page of [NaN, Infinity, -10, 0]) assert.equal(waterfallPageWindow(2000, page).page, 1);
});

test("API and SSR use the same batch boundaries and expose short-lived HTTP caching", async () => {
  const all = getAllWallpapers("en");
  for (const page of [1, 2, 999]) {
    const response = await GET(new NextRequest(`https://example.com/api/waterfall?locale=en&page=${page}`));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "public, max-age=60");
    const payload = await response.json();
    const range = waterfallPageWindow(all.length, page);
    assert.equal(payload.page, range.page);
    assert.equal(payload.totalCount, all.length);
    assert.deepEqual(payload.items.map((item: { ssd: string }) => item.ssd), all.slice(range.start, range.end).map((item) => item.Ssd));
  }
});
