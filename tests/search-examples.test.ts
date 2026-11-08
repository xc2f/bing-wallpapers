import assert from "node:assert/strict";
import test from "node:test";
import { filterWallpapersByDate, getAllWallpapers, searchWallpapers } from "../lib/archive";
import { getDictionary, locales } from "../lib/i18n";
import { getSearchExamples } from "../lib/search-examples";

test("examples match available records in every language and selected date range", () => {
  for (const locale of locales) {
    const all = getAllWallpapers(locale);
    for (const records of [all, filterWallpapersByDate(all, "2026", "10"), all.slice(0, 1)]) {
      const examples = getSearchExamples(records, locale);
      assert.equal(examples.length, records.length ? 6 : 0);
      for (const example of examples) {
        assert.ok(searchWallpapers(records, example.query).length > 0, `${locale}: ${example.query}`);
      }
    }
  }
});

test("examples prefer local keywords and fall back to English when needed", () => {
  const local = [{ Ssd: "20261101", ImageContent: { Title: "布莱德湖与蝴蝶" } }];
  const english = [{ Ssd: "20261101", ImageContent: { Title: "Lake Bled and a butterfly" } }];
  assert.equal(getSearchExamples(local, "zh")[0].query, getDictionary("zh").filterHelpQueryPhrase);
  assert.equal(getSearchExamples(english, "zh")[0].query, getDictionary("en").filterHelpQueryPhrase);
});

test("sparse archives generate usable examples without inventing results", () => {
  for (const records of [
    [{ Ssd: "20261101", ImageContent: { Title: "秋の山々 — 旅の記録" } }],
    [{ Ssd: "20261101" }],
  ]) {
    for (const example of getSearchExamples(records, "ja")) {
      assert.equal(searchWallpapers(records, example.query).length, 1, example.query);
    }
  }
  assert.deepEqual(getSearchExamples([], "zh"), []);
});
