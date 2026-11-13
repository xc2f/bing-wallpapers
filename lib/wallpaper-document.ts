import { toAbsoluteUrl, type WallpaperItem } from "@/lib/archive";
import { getDictionary, localizePath, type Locale } from "@/lib/i18n";
import { siteUrl } from "@/lib/seo";

export function cleanText(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

export function wallpaperDocument(wallpaper: WallpaperItem, locale: Locale) {
  const content = wallpaper.ImageContent;
  const date = wallpaper.Ssd.match(/^(\d{4})(\d{2})(\d{2})(?:_|$)/);
  const translation = wallpaper.Translation;
  const dictionary = getDictionary(locale);
  return {
    title: cleanText(content?.Title) || wallpaper.Ssd,
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
