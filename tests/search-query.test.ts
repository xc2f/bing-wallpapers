import assert from "node:assert/strict";
import test from "node:test";
import { getAllWallpapers, getSearchHighlightTerms, searchWallpapers, type WallpaperItem } from "../lib/archive";
import { NextRequest } from "next/server";
import { GET } from "../app/api/waterfall/route";

const records: WallpaperItem[] = [
  { Ssd: "20260930", ImageContent: { Title: "Lake", Description: "mountain water" } },
  { Ssd: "20261001_1200", FullDateString: "2026年10月1日", ImageContent: { Title: "Lake Bled", Description: "mountain water", Copyright: "Alice" } },
  { Ssd: "20261015", ImageContent: { Title: "Lake in city", Description: "urban water" } },
  { Ssd: "20261031", ImageContent: { Title: "Forest", Description: "mountain trees" } },
  { Ssd: "20261101", ImageContent: { Title: "Forest", Description: "autumn trees" } },
  { Ssd: "20240229", ImageContent: { Title: "Leap day" } },
  { Ssd: "20261002", ImageContent: { Title: "Lake, Forest (AND OR NOT)", Description: "lake -city" } },
];
const ids = (query: string) => searchWallpapers(records, query).map((record) => record.Ssd).sort();

test("field colons allow whitespace before values, including quotes and ranges", () => {
  for (const [spaced, compact] of [
    ['title: Lake', 'title:Lake'],
    ['title:   "Lake Bled"', 'title:"Lake Bled"'],
    ['description:\tmountain copyright: Alice', 'description:mountain copyright:Alice'],
    ['date: 2026-10-01..2026-10-31', 'date:2026-10-01..2026-10-31'],
    ['(title: Lake OR title: Forest) AND date: 2026-10 NOT city', '(title:Lake OR title:Forest) AND date:2026-10 NOT city'],
    ['title: "Lake, Forest (AND OR NOT)"', 'title:"Lake, Forest (AND OR NOT)"'],
    ['title: AND', 'title:AND'],
    ['title：　Lake', 'title:Lake'],
    ['ssd: 20261001', 'ssd:20261001'],
  ]) {
    assert.deepEqual(ids(spaced), ids(compact), spaced);
    assert.deepEqual(getSearchHighlightTerms(spaced), getSearchHighlightTerms(compact), spaced);
  }
  for (const query of ['title:', 'title:   ', '(title: )', 'title: "Lake']) assert.deepEqual(ids(query), [], query);
});

test("date ranges include both endpoints, use archive dates and accept compact dates", () => {
  const expected = ["20261001_1200", "20261002", "20261015", "20261031"];
  assert.deepEqual(ids("date:2026-10-01..2026-10-31"), expected);
  assert.deepEqual(ids("date:20261001..20261031"), expected);
  assert.deepEqual(ids("date:2026-10"), expected);
  assert.deepEqual(ids("date:202610"), expected);
  assert.deepEqual(ids("date:2026-10-01"), ["20261001_1200"]);
});

test("ranges accept open bounds and expand month or year endpoints", () => {
  assert.deepEqual(ids("date:..2026-09-30"), ["20240229", "20260930"]);
  assert.deepEqual(ids("date:2026-11-01.."), ["20261101"]);
  assert.deepEqual(ids("date:2026-10..2026-11"), records.filter((record) => record.Ssd.startsWith("202610") || record.Ssd.startsWith("202611")).map((record) => record.Ssd).sort());
  assert.deepEqual(ids("date:2024..2024"), ["20240229"]);
});

test("invalid, reversed and nonexistent date bounds never broaden results", () => {
  for (const value of ["2026-11-01..2026-10-01", "2026-02-29..2026-03-01", "2026-04-31", "2026-13", "2026-00", "..", "2026...2027", "bad..2026", "0000"]) {
    assert.deepEqual(ids(`date:${value}`), [], value);
  }
  assert.deepEqual(ids("date:2024-02-29"), ["20240229"]);
  assert.deepEqual(ids("date:bad..2026 OR title:Forest"), ["20261002", "20261031", "20261101"]);
});

test("ranges intersect fields, phrases, exclusions and other ranges", () => {
  assert.deepEqual(ids('title:Lake desc:mountain date:2026-10-01..2026-10-31 -city'), ["20261001_1200"]);
  assert.deepEqual(ids('Lake Bled date:2026-10-01..2026-10-31'), ["20261001_1200"]);
  assert.deepEqual(ids('date:2026-10..2026-11 date:2026-10-20..2026-12'), ["20261031", "20261101"]);
  assert.deepEqual(ids('date:2026-10..2026-10 -city'), ["20261001_1200", "20261031"]);
});

test("AND binds before OR; parentheses and NOT compose with date ranges", () => {
  assert.deepEqual(ids('(title:Lake OR title:Forest) AND date:2026-10-01..2026-10-31 AND NOT city'), ["20261001_1200", "20261031"]);
  assert.deepEqual(ids('title:Forest OR title:Lake AND date:2026-09'), ["20260930", "20261002", "20261031", "20261101"]);
  assert.deepEqual(ids('(title:Lake, title:Forest) date:2026-10 NOT (city OR copyright:Alice)'), ["20261031"]);
  assert.deepEqual(ids('NOT NOT title:Forest'), ["20261002", "20261031", "20261101"]);
  assert.deepEqual(ids('title:Lake NOT copyright:Alice'), ["20260930", "20261002", "20261015"]);
  assert.deepEqual(ids('NOT city date:2026-10'), ["20261001_1200", "20261031"]);
});

test("quoted punctuation and operator words stay literal; legacy phrases and commas work", () => {
  assert.deepEqual(ids('title:"Lake, Forest (AND OR NOT)"'), ["20261002"]);
  assert.deepEqual(ids('desc:"lake -city"'), ["20261002"]);
  assert.deepEqual(ids('Lake Bled'), ["20261001_1200"]);
  assert.deepEqual(ids('"Lake Bled"'), ["20261001_1200"]);
  assert.deepEqual(ids('title:Leap，title:Forest'), ["20240229", "20261002", "20261031", "20261101"]);
  assert.deepEqual(ids('description:mountain -trees'), ["20260930", "20261001_1200"]);
  assert.deepEqual(ids('date:2026年'), ["20261001_1200"]);
  assert.ok(ids('-city').includes("20261031"));
});

test("malformed expressions and excessive nesting fail closed", () => {
  for (const query of ['(title:Lake', 'title:Lake)', 'title:Lake AND', 'OR title:Lake', 'NOT', 'title:"Lake', 'title:Lake OR OR Forest', '()']) {
    assert.deepEqual(ids(query), [], query);
  }
  assert.deepEqual(ids('('.repeat(40) + 'Lake' + ')'.repeat(40)), []);
  assert.deepEqual(ids(Array(260).fill('Lake').join(' AND ')), []);
});

test("highlights include positive branches but omit excluded fields and range syntax", () => {
  assert.deepEqual(getSearchHighlightTerms('(title:lake OR desc:forest) AND NOT title:city date:2026-10..2026-11'), {
    title: ["lake"], description: ["forest"],
  });
  assert.deepEqual(getSearchHighlightTerms('NOT NOT title:lake'), { title: ["lake"], description: [] });
});

test("waterfall API applies combined ranges and intersects separate year/month filters", async () => {
  const first = getAllWallpapers("zh")[0];
  assert.ok(first);
  const date = first.Ssd.slice(0, 8);
  const params = new URLSearchParams({
    locale: "zh", year: date.slice(0, 4), month: date.slice(4, 6),
    q: `date:${date}..${date} AND (ssd:${first.Ssd} OR ssd:00000000)`,
  });
  const response = await GET(new NextRequest(`https://example.com/api/waterfall?${params}`));
  const result = await response.json();
  assert.equal(result.totalCount, 1);
  assert.equal(result.items[0].ssd, first.Ssd);
  params.set("year", String(Number(date.slice(0, 4)) - 1));
  const conflict = await GET(new NextRequest(`https://example.com/api/waterfall?${params}`));
  assert.equal((await conflict.json()).totalCount, 0);
});
