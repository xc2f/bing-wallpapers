import { getWallpaperBingUrl, toAbsoluteUrl, type WallpaperItem } from "@/lib/archive";
import { getBingHeadline } from "@/lib/bing-headline";
import { getDictionary, localizePath, type Locale } from "@/lib/i18n";
import { siteUrl } from "@/lib/seo";
import { wallpaperLocation } from "@/lib/wallpaper-location";

export function cleanText(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

export function wallpaperDocument(wallpaper: WallpaperItem, locale: Locale) {
  const content = wallpaper.ImageContent;
  const date = wallpaper.Ssd.match(/^(\d{4})(\d{2})(\d{2})(?:_|$)/);
  const translation = wallpaper.Translation;
  const dictionary = getDictionary(locale);
  const title = cleanText(content?.Title) || wallpaper.Ssd;
  const headline = cleanText(getBingHeadline(content?.Headline));
  return {
    title,
    headline: headline && headline !== title ? headline : undefined,
    quickFact: cleanText(content?.QuickFact?.MainText) || undefined,
    location: wallpaperLocation(wallpaper, locale),
    bingUrl: getWallpaperBingUrl(wallpaper),
    description: cleanText(content?.Description),
    copyright: cleanText(content?.Copyright),
    date: date ? date.slice(1).join("-") : cleanText(wallpaper.FullDateString),
    source: siteUrl(localizePath(locale, `/wallpaper/${wallpaper.Ssd}`)),
    image: toAbsoluteUrl(content?.Image?.Wallpaper || content?.Image?.Url),
    translationNotice: translation?.generatedBy === "AI"
      ? translation.reviewedByHuman === false
        ? dictionary.aiTranslationUnreviewedNotice
        : dictionary.aiTranslationNotice
      : "",
  };
}
