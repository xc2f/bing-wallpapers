import { readFile, writeFile } from "node:fs/promises";
import { getBingHeadline } from "../lib/bing-headline";
import { parseBingMapLocation } from "../lib/bing-map-location";
import type { WallpaperItem } from "../lib/archive";

const source = new URL("../db/media_contents.json", import.meta.url);
const output = new URL("../db/media_contents.runtime.json", import.meta.url);
const { schemaVersion, defaultLocale, fallbackLocale, mediaContents } = JSON.parse(
  await readFile(source, "utf8"),
) as {
  schemaVersion: number;
  defaultLocale: string;
  fallbackLocale: string;
  mediaContents: Record<string, WallpaperItem[]>;
};

function selectRuntimeFields(item: WallpaperItem): WallpaperItem {
  const { Ssd, FullDateString, imageId, ImageContent, Translation } = item;
  const quickFact = ImageContent?.QuickFact?.MainText?.trim();
  return {
    Ssd,
    FullDateString,
    imageId,
    mapLocation: parseBingMapLocation(ImageContent?.MapLink?.Url),
    ImageContent: ImageContent && {
      Title: ImageContent.Title,
      Headline: getBingHeadline(ImageContent.Headline),
      Description: ImageContent.Description,
      Copyright: ImageContent.Copyright,
      BackstageUrl: ImageContent.BackstageUrl,
      QuickFact: quickFact ? { MainText: quickFact } : undefined,
      Image: ImageContent.Image && {
        Url: ImageContent.Image.Url,
        Wallpaper: ImageContent.Image.Wallpaper,
        Downloadable: ImageContent.Image.Downloadable,
      },
    },
    Translation: Translation && {
      generatedBy: Translation.generatedBy,
      reviewedByHuman: Translation.reviewedByHuman,
      sourceLocale: Translation.sourceLocale,
      sourceSsd: Translation.sourceSsd,
      originalText: Translation.originalText,
    },
  };
}

await writeFile(output, JSON.stringify({
  schemaVersion,
  defaultLocale,
  fallbackLocale,
  mediaContents: Object.fromEntries(
    Object.entries(mediaContents).map(([locale, items]) => [locale, items.map(selectRuntimeFields)]),
  ),
}));
