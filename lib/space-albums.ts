import type { WallpaperItem } from "@/lib/archive";
import { getImageTaxonomy } from "@/lib/image-taxonomy";

export function getSpaceAlbumGroups(items: WallpaperItem[]) {
  const seen = new Set<string>();
  const space = items.filter(item => {
    if (!item.imageId || seen.has(item.imageId) || getImageTaxonomy(item)?.category !== "space") return false;
    seen.add(item.imageId);
    return true;
  });
  return ["", "moon", "stars"].map(tag => ({
    id: tag || "space",
    tag,
    items: tag ? space.filter(item => getImageTaxonomy(item)?.tags.includes(tag)) : space,
  })).filter(group => group.items.length > 0);
}
