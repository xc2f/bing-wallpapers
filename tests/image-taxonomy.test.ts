import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import data from "../db/image_tags.json";
import { GET } from "../app/api/waterfall/route";
import { getAllWallpapers } from "../lib/archive";
import { filterWallpapersByTaxonomy, getImageTaxonomy, getTaxonomyCounts } from "../lib/image-taxonomy";
import { isTaxonomyNames, resolveTaxonomyLabel } from "../lib/taxonomy-names";
import { getWallpaperFilters, wallpaperFilterParams } from "../lib/wallpaper-filters";

test("country filters intersect categories and tags and exclude unclassified images", () => {
  const items = getAllWallpapers("en");
  const sample = items.find((item) => getImageTaxonomy(item)?.countries?.length && getImageTaxonomy(item)?.tags.length);
  assert.ok(sample);
  const taxonomy = getImageTaxonomy(sample)!;
  const country = taxonomy.countries![0];
  const expected = items.filter((item) => {
    const record = getImageTaxonomy(item);
    return record?.countries?.includes(country) && record.category === taxonomy.category && record.tags.includes(taxonomy.tags[0]);
  });
  assert.deepEqual(filterWallpapersByTaxonomy(items, taxonomy.category, taxonomy.tags[0], country), expected);
  assert.ok(expected.includes(sample));
  assert.deepEqual(filterWallpapersByTaxonomy(items, "", "", "nonexistent-country"), []);
  assert.equal(filterWallpapersByTaxonomy(items), items);
});

test("country counts include every country of an image and deduplicate image IDs", () => {
  const items = getAllWallpapers("en");
  const expected = new Map<string, Set<string>>();
  for (const item of items) {
    for (const country of getImageTaxonomy(item)?.countries ?? []) {
      if (!expected.has(country)) expected.set(country, new Set());
      expected.get(country)!.add(item.imageId!);
    }
  }
  const counts = new Map(getTaxonomyCounts([...items, ...items], "countries"));
  assert.ok(counts.size > 0);
  assert.deepEqual(counts, new Map([...expected].map(([id, images]) => [id, images.size])));
});

test("country labels use the remote names and locale fallback; validation accepts old data", () => {
  assert.ok(isTaxonomyNames(data.taxonomy));
  assert.equal(resolveTaxonomyLabel(data.taxonomy, "US", "zh", "country"), data.taxonomy.country.tags.US.zh);
  assert.equal(resolveTaxonomyLabel({ defaultLocale: "fr", country: { tags: { US: { fr: "États-Unis" } } } }, "US", "zh", "country"), "États-Unis");
  assert.equal(resolveTaxonomyLabel(undefined, "US", "zh", "country"), "US");
  assert.ok(isTaxonomyNames({ categories: {}, tags: {} }));
  assert.equal(isTaxonomyNames({ country: { tags: { US: { en: 42 } } } }), false);
  assert.equal(isTaxonomyNames({ country: { label: [] } }), false);
});

test("waterfall batches apply country filters and filter URLs preserve the country", async () => {
  const filters = getWallpaperFilters({ country: " US ", category: "nature", tag: "waterfall" });
  const params = wallpaperFilterParams(filters);
  assert.equal(params.get("country"), "US");
  const response = await GET(new NextRequest(`https://example.com/api/waterfall?locale=en&${params}`));
  const result = await response.json();
  const expected = filterWallpapersByTaxonomy(getAllWallpapers("en"), "nature", "waterfall", "US");
  assert.ok(expected.length > 0);
  assert.equal(result.totalCount, expected.length);
  assert.deepEqual(result.items.map((item: { ssd: string }) => item.ssd), expected.slice(0, 180).map((item) => item.Ssd));
});
