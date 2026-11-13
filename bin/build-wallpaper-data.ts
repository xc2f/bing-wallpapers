import { readFile, writeFile } from "node:fs/promises";
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
  return {
    Ssd,
    FullDateString,
    imageId,
    ImageContent: ImageContent && {
      Title: ImageContent.Title,
      Description: ImageContent.Description,
      Copyright: ImageContent.Copyright,
      BackstageUrl: ImageContent.BackstageUrl,
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
