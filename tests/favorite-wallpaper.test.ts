import assert from "node:assert/strict";
import test from "node:test";
import {
  favoriteKey, identifyFavorite, indexFavoriteArchive, isSameFavorite, localizeFavorite,
  type FavoriteWallpaper,
} from "../lib/favorite-wallpaper";

const saved: FavoriteWallpaper = {
  ssd: "20251116",
  locale: "zh",
  title: "中文标题",
  previewUrl: "https://www.bing.com/th?id=OHR.Sample_ZH-CN.webp",
};
const translatedUrl = "https://www.bing.com/th?id=OHR.Sample_EN-US.webp";
const sourceArchive = indexFavoriteArchive([{
  Ssd: saved.ssd,
  imageId: "bing:sample:a",
  ImageContent: { Image: { Url: saved.previewUrl } },
}]);

test("legacy favorites recover image identity and prefer the matching image in the current language", () => {
  const migrated = identifyFavorite(saved, sourceArchive);
  const targetArchive = indexFavoriteArchive([
    { Ssd: saved.ssd, imageId: "bing:other:b" },
    { Ssd: "20251115", imageId: "bing:sample:a", ImageContent: { Title: "English title", Image: { Url: translatedUrl } } },
  ]);
  const translated = localizeFavorite(migrated, "en", targetArchive);
  assert.equal(translated.ssd, "20251115");
  assert.equal(translated.locale, "en");
  assert.equal(translated.title, "English title");
  assert.equal(translated.previewUrl, translatedUrl);
  assert.equal(favoriteKey(translated), favoriteKey(migrated));
  assert.ok(isSameFavorite(translated, migrated));
});

test("a reused archive ID cannot replace or merge a favorite of a different image", () => {
  const other = { ...saved, locale: "en" as const, imageId: "bing:other:b" };
  const targetArchive = indexFavoriteArchive([{ Ssd: other.ssd, imageId: other.imageId }]);
  const migrated = identifyFavorite(saved, sourceArchive);
  assert.equal(localizeFavorite(migrated, "en", targetArchive), migrated);
  assert.equal(identifyFavorite(saved, targetArchive), saved);
  assert.equal(isSameFavorite(migrated, other), false);
});
