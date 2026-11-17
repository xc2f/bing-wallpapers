import { isValidLocale } from "@/lib/i18n";
import type { FavoriteWallpaper } from "@/lib/favorite-wallpaper";

const format = "bing-wallpapers-favorites";
const version = 1;

export function isFavoriteWallpaper(entry: unknown): entry is FavoriteWallpaper {
  if (!entry || typeof entry !== "object") return false;
  const item = entry as Partial<FavoriteWallpaper>;
  return typeof item.locale === "string" && isValidLocale(item.locale) &&
    typeof item.ssd === "string" && /^[\w-]+$/.test(item.ssd) &&
    typeof item.title === "string" &&
    (item.imageId === undefined || typeof item.imageId === "string") &&
    typeof item.previewUrl === "string" && /^(https?:\/\/|$)/.test(item.previewUrl);
}

export interface FavoritesBackupSite {
  name: string;
  url: string;
}

export function encodeFavoritesBackup(favorites: FavoriteWallpaper[], site: FavoritesBackupSite) {
  return JSON.stringify({ format, version, site, favorites }, null, 2);
}

export function decodeFavoritesBackup(text: string) {
  try {
    const backup = JSON.parse(text) as { format?: unknown; version?: unknown; favorites?: unknown };
    if (backup?.format !== format || backup.version !== version || !Array.isArray(backup.favorites)) return null;
    const favorites = backup.favorites.filter(isFavoriteWallpaper);
    return { favorites, skipped: backup.favorites.length - favorites.length };
  } catch {
    return null;
  }
}
