import assert from "node:assert/strict";
import test from "node:test";
import { getAllWallpapers, getFilteredWallpapers, getAdjacentWallpapersFromList, getRelatedWallpapersFromList } from "../lib/archive";
import { getImageTaxonomy } from "../lib/image-taxonomy";
import { locales } from "../lib/i18n";
import { selectDetailNavigation } from "../lib/detail-browse";

test("browser detail navigation preserves server filters, ranking and fallback in every locale", () => {
  for (const locale of locales) {
    const all = getAllWallpapers(locale);
    const index = all.map((item) => ({ ...item, taxonomy: getImageTaxonomy(item) }));
    const selected = all[Math.floor(all.length / 2)];
    const taxonomy = getImageTaxonomy(selected);
    for (const filters of [{}, { category: taxonomy?.category }, { country: taxonomy?.countries?.[0], tag: taxonomy?.tags[0] },
      { q: "ocean" }, { year: "2026", month: "07" }, { category: "missing" }, { q: "date:2026 AND NOT city" }]) {
      const filtered = getFilteredWallpapers(locale, filters);
      const list = filtered.includes(selected) ? filtered : all;
      const expected = { ...getAdjacentWallpapersFromList(list, selected.Ssd), related: getRelatedWallpapersFromList(list, selected.Ssd, 8) };
      const result = selectDetailNavigation(index, selected.Ssd, filters);
      assert.equal(result.previous?.Ssd, expected.previous?.Ssd);
      assert.equal(result.next?.Ssd, expected.next?.Ssd);
      assert.deepEqual(result.related.map((item) => item.Ssd), expected.related.map((item) => item.Ssd));
    }
  }
});
