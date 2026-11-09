import type { WallpaperItem } from "@/lib/archive";
import { searchWallpapers } from "@/lib/wallpaper-search";
import type { WallpaperFilters } from "@/lib/wallpaper-filters";

export interface DetailIndexItem extends WallpaperItem {
  taxonomy?: { category: string; tags: string[]; countries?: string[] };
}
export interface DetailNavigation {
  previous: WallpaperItem | null;
  next: WallpaperItem | null;
  related: WallpaperItem[];
}

// The index is a static asset. Filtering it in the browser never invokes a Worker.
export function selectDetailNavigation(items: DetailIndexItem[], ssd: string, filters: WallpaperFilters): DetailNavigation {
  const dated = items.filter((item) => {
    if (!filters.year && !filters.month) return true;
    const match = item.Ssd.match(/^(\d{4})(\d{2})(\d{2})/);
    return Boolean(match && (!filters.year || match[1] === filters.year) && (!filters.month || match[2] === filters.month));
  });
  const filtered = searchWallpapers(dated, filters.q).filter((item) => {
    const taxonomy = (item as DetailIndexItem).taxonomy;
    return (!filters.category || taxonomy?.category === filters.category) &&
      (!filters.tag || taxonomy?.tags.includes(filters.tag)) &&
      (!filters.country || taxonomy?.countries?.includes(filters.country));
  }) as DetailIndexItem[];
  const list = filtered.some((item) => item.Ssd === ssd) ? filtered : items;
  const currentIndex = list.findIndex((item) => item.Ssd === ssd);
  const current = list[currentIndex];
  if (!current) return { previous: null, next: null, related: [] };
  const taxonomy = current.taxonomy;
  const tags = new Set(taxonomy?.tags ?? []);
  const related = list.map((item, index) => ({
    item,
    shared: item.taxonomy?.tags.filter((tag) => tags.has(tag)).length ?? 0,
    category: Number(Boolean(taxonomy && item.taxonomy?.category === taxonomy.category)),
    distance: Math.abs(index - currentIndex),
  })).filter(({ item }) => item.Ssd !== ssd && (!current.imageId || item.imageId !== current.imageId))
    .sort((a, b) => b.shared - a.shared || b.category - a.category || a.distance - b.distance)
    .slice(0, 8).map(({ item }) => item);
  return { previous: list[currentIndex + 1] ?? null, next: list[currentIndex - 1] ?? null, related };
}
