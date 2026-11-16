import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import data from "../db/media_contents.json";
import { GET } from "../app/api/waterfall/route";
import {
  getAllWallpapers, getWallpaperBySsd, getAdjacentWallpapers, selectWallpaperRecords,
  getRelatedWallpapers, getTranslationSource, getWallpaperMapLocation, searchWallpapers,
} from "../lib/archive";
import { locales, formatArchiveDate } from "../lib/i18n";

test("structured map locations take priority over legacy links and invalid coordinates fall back", () => {
  const wallpaper = {
    Ssd: "20261027",
    MapLocation: { latitude: 0, longitude: -83.44, label: " 本地地名 " },
    ImageContent: { MapLink: { Url: "/geo/REST/v1/Imagery/Map/Road/32,-84/8" } },
  };
  assert.deepEqual(getWallpaperMapLocation(wallpaper), { point: [-83.44, 0], label: "本地地名" });
  assert.deepEqual(getWallpaperMapLocation({
    ...wallpaper, MapLocation: { ...wallpaper.MapLocation, latitude: 91 },
  })?.point, [-84, 32]);
});

test("a quick fact can have a translation source independent of the wallpaper description", () => {
  const source = getAllWallpapers("zh")[0];
  const wallpaper = {
    Ssd: source.Ssd,
    imageId: source.imageId,
    FieldTranslations: {
      "QuickFact.MainText": { generatedBy: "AI", sourceLocale: "zh" as const, sourceSsd: source.Ssd },
    },
  };
  assert.equal(getTranslationSource(wallpaper), undefined);
  assert.equal(getTranslationSource(wallpaper, "QuickFact.MainText"), source);
});

test("each locale only shows its own records without English fallback", () => {
  const fallback = data.mediaContents[data.fallbackLocale as typeof locales[number]];
  for (const locale of locales) {
    const localized = data.mediaContents[locale];
    const wallpapers = getAllWallpapers(locale);
    const expectedDates = new Set(localized.map((item) => item.Ssd.slice(0, 8)));
    assert.equal(wallpapers.length, expectedDates.size);
    assert.equal(new Set(wallpapers.map((item) => item.Ssd.slice(0, 8))).size, wallpapers.length);
    for (const item of wallpapers) {
      const sameDay = localized.filter((record) => record.Ssd.slice(0, 8) === item.Ssd.slice(0, 8));
      assert.ok(sameDay.includes(item as typeof sameDay[number]));
      assert.deepEqual(getWallpaperBySsd(item.Ssd, locale), item);
    }
    for (const item of fallback) {
      const expected = wallpapers.find((record) => record.Ssd.slice(0, 8) === item.Ssd.slice(0, 8));
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
    for (const [index, item] of result.items.entries()) {
      const source = wallpapers[index];
      assert.equal(item.copyright, source.ImageContent?.Copyright);
      assert.equal(item.fullDate, formatArchiveDate(locale, source.Ssd, source.FullDateString));
    }
    assert.deepEqual(result.items.map((item: { ssd: string; title: string }) => [item.ssd, item.title]),
      wallpapers.slice(0, 180).map((item) => [item.Ssd, item.ImageContent?.Title]));
  }
});

test("AI translation sources resolve from their recorded locale and archive ID", () => {
  for (const locale of locales) {
    for (const wallpaper of getAllWallpapers(locale)) {
      const metadata = wallpaper.Translation;
      if (metadata?.generatedBy === "AI" && metadata.sourceLocale && metadata.sourceSsd) {
        assert.deepEqual(getTranslationSource(wallpaper), metadata.originalText
          ? { Ssd: metadata.sourceSsd, imageId: wallpaper.imageId, ImageContent: metadata.originalText }
          : data.mediaContents[metadata.sourceLocale].find(
            (item) => item.Ssd === metadata.sourceSsd && item.imageId === wallpaper.imageId,
          ));
      } else {
        assert.equal(getTranslationSource(wallpaper), undefined);
      }
    }
  }
});

test("a Korean fallback uses its saved English original and never borrows another image's text", () => {
  const english = getAllWallpapers("en")[0];
  const originalText = { Title: "Flamingos in the Ebro Delta", Description: "Flamingos gather in shallow lagoons." };
  const wallpaper = {
    Ssd: english.Ssd,
    imageId: "bing:DeltaEbro:test",
    Translation: { generatedBy: "AI", sourceLocale: "en" as const, sourceSsd: english.Ssd },
  };
  assert.equal(getTranslationSource(wallpaper), undefined);
  assert.deepEqual(getTranslationSource({
    ...wallpaper,
    Translation: { ...wallpaper.Translation, originalText },
  })?.ImageContent, originalText);
});

test("same-day records prefer official content and empty archives stay empty", () => {
  const local = { Ssd: "20261101_1600", ImageContent: { Title: "本地图片" } };
  const translated = { Ssd: "20261101_1800", Translation: { generatedBy: "AI" } };
  const older = { Ssd: "20261031" };
  assert.deepEqual(selectWallpaperRecords([older, local, translated]), [local, older]);
  assert.deepEqual(selectWallpaperRecords([translated, local, older]), [local, older]);
  assert.deepEqual(selectWallpaperRecords([]), []);
});
