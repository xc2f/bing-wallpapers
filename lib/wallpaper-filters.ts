export const wallpaperFilterKeys = ["q", "year", "month", "category", "tag", "country"] as const;
export type WallpaperFilters = Partial<Record<(typeof wallpaperFilterKeys)[number], string>>;

export function getWallpaperFilters(source: WallpaperFilters): WallpaperFilters {
  return Object.fromEntries(wallpaperFilterKeys.map((key) => [key, source[key]?.trim() ?? ""]));
}

export function wallpaperFilterParams(filters: WallpaperFilters) {
  const params = new URLSearchParams();
  for (const key of wallpaperFilterKeys) {
    const value = filters[key]?.trim();
    if (value) params.set(key, value);
  }
  return params;
}
