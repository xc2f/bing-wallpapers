import assert from "node:assert/strict";
import test from "node:test";
import {
  filterWallpapersByDate, getAllWallpapers, getFilteredWallpapers,
  getRelatedWallpapersFromList, searchWallpapers, selectWallpaperRecords,
  type WallpaperItem,
} from "../lib/archive";
import { filterWallpapersByTaxonomy, getImageTaxonomy } from "../lib/image-taxonomy";
import { locales } from "../lib/i18n";

// Compare against the previous full-ranking algorithm to preserve relevance and tie order.
function rankedRelated(items: WallpaperItem[], ssd: string, limit: number) {
  const index = items.findIndex((item) => item.Ssd === ssd);
  if (index < 0) return items.slice(0, limit);
  const current = items[index];
  const taxonomy = getImageTaxonomy(current);
  const tags = new Set(taxonomy?.tags ?? []);
  return items.map((item, position) => {
    const candidate = getImageTaxonomy(item);
    return { item, shared: candidate?.tags.filter((tag) => tags.has(tag)).length ?? 0,
      category: Number(Boolean(taxonomy && candidate?.category === taxonomy.category)),
      distance: Math.abs(position - index) };
  }).filter(({ item }) => item.Ssd !== ssd && (!current.imageId || item.imageId !== current.imageId))
    .sort((a, b) => b.shared - a.shared || b.category - a.category || a.distance - b.distance)
    .slice(0, limit).map(({ item }) => item);
}

test("bounded recommendation ranking preserves results across languages and filtered lists", () => {
  for (const locale of locales) {
    const all = getAllWallpapers(locale);
    for (const items of [all, filterWallpapersByTaxonomy(all, "nature"), all.slice(0, 20)]) {
      for (const item of [items[0], items[Math.floor(items.length / 2)], items.at(-1)].filter((item): item is WallpaperItem => Boolean(item))) {
        for (const limit of [0, 1, 8, 30]) {
          assert.deepEqual(getRelatedWallpapersFromList(items, item.Ssd, limit), rankedRelated(items, item.Ssd, limit));
        }
      }
    }
  }
});

test("cached filters retain search ranking, intersect filters, and isolate languages", () => {
  for (const locale of locales) {
    for (const filters of [{}, { q: "lake" }, { year: "2026", month: "07" },
      { category: "nature", country: "CA", tag: "lake" }, { q: "NOT ocean", category: "nature" }]) {
      const all = getAllWallpapers(locale);
      const expected = filterWallpapersByTaxonomy(searchWallpapers(
        filterWallpapersByDate(all, filters.year, filters.month), filters.q
      ), filters.category, filters.tag, filters.country);
      const result = getFilteredWallpapers(locale, filters);
      assert.deepEqual(result, expected);
      assert.equal(getFilteredWallpapers(locale, filters), result);
    }
  }
});

test("one-pass date selection preserves official preference and latest archive ID", () => {
  const items: WallpaperItem[] = [
    { Ssd: "20261101_1800", Translation: { generatedBy: "AI" } },
    { Ssd: "20261101_1200" }, { Ssd: "20261101_0900" },
    { Ssd: "20261031_1200", Translation: { generatedBy: "AI" } },
    { Ssd: "20261031_1800", Translation: { generatedBy: "AI" } },
  ];
  for (const input of [items, [...items].reverse()]) {
    assert.deepEqual(selectWallpaperRecords(input), [items[1], items[4]]);
  }
});

test("filter eviction preserves results when revisiting older query combinations", () => {
  const filters = { category: "nature", country: "CA", tag: "lake" };
  const expected = [...getFilteredWallpapers("en", filters)];
  for (let index = 0; index < 80; index++) getFilteredWallpapers("en", { q: `ssd:missing${index}` });
  assert.deepEqual(getFilteredWallpapers("en", filters), expected);
});
