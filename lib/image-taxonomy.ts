import data from "@/db/image_tags.json";
import type { WallpaperItem } from "@/lib/archive";

interface ImageTaxonomy {
  category: string;
  tags: string[];
}
const images: Record<string, ImageTaxonomy> = data.images;

export function getImageTaxonomy(item: Pick<WallpaperItem, "imageId">) {
  return item.imageId ? images[item.imageId] : undefined;
}

export function filterWallpapersByTaxonomy(items: WallpaperItem[], category = "", tag = "") {
  if (!category && !tag) return items;
  return items.filter((item) => {
    const taxonomy = getImageTaxonomy(item);
    return (!category || taxonomy?.category === category) && (!tag || taxonomy?.tags.includes(tag));
  });
}

export function getTaxonomyCounts(items: WallpaperItem[], field: "category" | "tags") {
  const counts = new Map<string, number>();
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.imageId || seen.has(item.imageId)) continue;
    seen.add(item.imageId);
    const taxonomy = getImageTaxonomy(item);
    const values = field === "category" ? (taxonomy ? [taxonomy.category] : []) : taxonomy?.tags ?? [];
    for (const value of new Set(values)) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
