import type { DetailIndexItem } from "@/lib/detail-browse";
import type { Locale } from "@/lib/i18n";

export interface FavoriteWallpaper {
  ssd: string;
  locale: Locale;
  title: string;
  previewUrl: string;
  imageId?: string;
}

export interface FavoriteArchive {
  byImageId: Map<string, DetailIndexItem>;
  byPreviewUrl: Map<string, DetailIndexItem>;
}

export function indexFavoriteArchive(items: DetailIndexItem[]): FavoriteArchive {
  const byImageId = new Map<string, DetailIndexItem>();
  const byPreviewUrl = new Map<string, DetailIndexItem>();

  for (const item of items) {
    const url = item.ImageContent?.Image?.Url;
    if (item.imageId && !byImageId.has(item.imageId)) byImageId.set(item.imageId, item);
    if (url && !byPreviewUrl.has(url)) byPreviewUrl.set(url, item);
  }
  return { byImageId, byPreviewUrl };
}

export function identifyFavorite(wallpaper: FavoriteWallpaper, archive?: FavoriteArchive): FavoriteWallpaper {
  if (wallpaper.imageId) return wallpaper;
  // Old favorites store the Bing preview URL. Match it exactly because a date can point to a different image.
  const imageId = archive?.byPreviewUrl.get(wallpaper.previewUrl)?.imageId;
  return imageId ? { ...wallpaper, imageId } : wallpaper;
}

export function favoriteKey(wallpaper: FavoriteWallpaper) {
  return wallpaper.imageId ?? `${wallpaper.locale}:${wallpaper.ssd}:${wallpaper.previewUrl}`;
}

export function isSameFavorite(first: FavoriteWallpaper, second: FavoriteWallpaper) {
  if (first.imageId && second.imageId) return first.imageId === second.imageId;
  return first.locale === second.locale && first.ssd === second.ssd && first.previewUrl === second.previewUrl;
}

export function localizeFavorite(wallpaper: FavoriteWallpaper, locale: Locale, archive?: FavoriteArchive): FavoriteWallpaper {
  if (wallpaper.locale === locale || !wallpaper.imageId) return wallpaper;
  const match = archive?.byImageId.get(wallpaper.imageId);
  if (!match) return wallpaper;
  return {
    ...wallpaper,
    locale,
    ssd: match.Ssd,
    title: match.ImageContent?.Title ?? wallpaper.title,
    previewUrl: match.ImageContent?.Image?.Url || wallpaper.previewUrl,
  };
}
