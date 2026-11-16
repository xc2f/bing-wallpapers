import { readFile, writeFile } from "node:fs/promises";
import { getBingHeadline } from "../lib/bing-headline";
import { normalizeArchiveMapLocation, parseBingMapLocation } from "../lib/bing-map-location";
import type { TranslationMetadata, WallpaperItem } from "../lib/archive";

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

function selectTranslationFields(translation?: TranslationMetadata): TranslationMetadata | undefined {
  if (!translation) return;
  const { generatedBy, reviewedByHuman, sourceLocale, sourceSsd, originalText } = translation;
  return { generatedBy, reviewedByHuman, sourceLocale, sourceSsd, originalText };
}

function selectRuntimeFields(item: WallpaperItem): WallpaperItem {
  const { Ssd, FullDateString, imageId, ImageContent, MapLocation, Translation, FieldTranslations } = item;
  const quickFact = ImageContent?.QuickFact?.MainText?.trim();
  const quickFactTranslation = selectTranslationFields(FieldTranslations?.["QuickFact.MainText"]);
  return {
    Ssd,
    FullDateString,
    imageId,
    mapLocation: normalizeArchiveMapLocation(MapLocation) ?? parseBingMapLocation(ImageContent?.MapLink?.Url),
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
    Translation: selectTranslationFields(Translation),
    FieldTranslations: quickFactTranslation ? { "QuickFact.MainText": quickFactTranslation } : undefined,
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
