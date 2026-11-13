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

export function legacyWaterfallQuery(search: URLSearchParams) {
  const filters = Object.fromEntries(wallpaperFilterKeys.map((key) => [key, search.get(key) ?? ""]));
  const query = wallpaperFilterParams(filters);
  const page = Number.parseInt(search.get("page") ?? "1", 10);
  if (page > 1) query.set("page", String(page));
  return query.size ? `?${query}` : "";
}
