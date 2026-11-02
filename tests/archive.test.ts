import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import data from "../db/media_contents.json";
import { GET } from "../app/api/waterfall/route";
import {
  getAllWallpapers, getWallpaperBySsd, getAdjacentWallpapers,
  getRelatedWallpapers, searchWallpapers,
} from "../lib/archive";
import { locales } from "../lib/i18n";

test("localized records take priority while missing records fall back to English", () => {
  const fallback = data.mediaContents[data.fallbackLocale as typeof locales[number]];
  for (const locale of locales) {
    const localized = data.mediaContents[locale];
    const wallpapers = getAllWallpapers(locale);
    const expectedIds = new Set([...fallback, ...localized].map((item) => item.Ssd));
    assert.equal(wallpapers.length, expectedIds.size);
    assert.equal(new Set(wallpapers.map((item) => item.Ssd)).size, wallpapers.length);
    assert.deepEqual(wallpapers.map((item) => item.Ssd), [...expectedIds].sort().reverse());
    for (const item of localized) {
      assert.deepEqual(getWallpaperBySsd(item.Ssd, locale), item);
    }
    for (const item of fallback) {
      const expected = localized.find((record) => record.Ssd === item.Ssd) ?? item;
      assert.deepEqual(getWallpaperBySsd(item.Ssd, locale), expected);
    }
  }
  assert.equal(getWallpaperBySsd("missing", "zh"), undefined);
});

test("search and detail navigation stay within the selected archive", () => {
  for (const locale of locales) {
    const wallpapers = getAllWallpapers(locale);
    if (!wallpapers.length) continue;
    const item = wallpapers[0];
    const title = item.ImageContent?.Title;
    if (title) assert.ok(searchWallpapers(wallpapers, `title:"${title}"`).includes(item));
    assert.deepEqual(getAdjacentWallpapers(item.Ssd, locale), {
      previous: wallpapers[1] ?? null, next: null,
    });
    for (const related of getRelatedWallpapers(item.Ssd, 8, locale)) {
      assert.ok(wallpapers.includes(related));
    }
  }
});

test("waterfall batches return the selected language's content and counts", async () => {
  for (const locale of locales) {
    const response = await GET(new NextRequest(`https://example.com/api/waterfall?locale=${locale}&page=1`));
    const result = await response.json();
    const wallpapers = getAllWallpapers(locale);
    assert.equal(result.totalCount, wallpapers.length);
    assert.deepEqual(result.items.map((item: { ssd: string; title: string }) => [item.ssd, item.title]),
      wallpapers.slice(0, 180).map((item) => [item.Ssd, item.ImageContent?.Title]));
  }
});
