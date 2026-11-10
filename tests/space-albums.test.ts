import assert from "node:assert/strict";
import test from "node:test";
import { getAllWallpapers } from "../lib/archive";
import { getImageTaxonomy } from "../lib/image-taxonomy";
import { getSpaceAlbumGroups } from "../lib/space-albums";

test("space collections include every space image once, including images without countries or tags", () => {
  const items = getAllWallpapers("en");
  const groups = getSpaceAlbumGroups([...items, ...items]);
  const all = groups.find(group => group.id === "space")!;
  const expected = new Set(items.filter(item => getImageTaxonomy(item)?.category === "space").map(item => item.imageId));
  assert.ok(expected.size > 0);
  assert.equal(all.items.length, expected.size);
  assert.deepEqual(new Set(all.items.map(item => item.imageId)), expected);
  assert.ok(all.items.some(item => !getImageTaxonomy(item)?.countries?.length));
  assert.ok(all.items.some(item => !getImageTaxonomy(item)?.tags.length));
  for (const group of groups.filter(group => group.tag)) {
    assert.deepEqual(group.items, all.items.filter(item => getImageTaxonomy(item)?.tags.includes(group.tag)));
  }
});

test("empty space collections are omitted", () => {
  assert.deepEqual(getSpaceAlbumGroups([]), []);
  const earth = getAllWallpapers("en").filter(item => getImageTaxonomy(item)?.category !== "space");
  assert.deepEqual(getSpaceAlbumGroups(earth), []);
});
