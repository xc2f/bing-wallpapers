import { getAllWallpapers, toAbsoluteUrl } from "@/lib/archive";
import { getImageTaxonomy } from "@/lib/image-taxonomy";
import { localizePath, type Locale } from "@/lib/i18n";
import { taxonomyLabel } from "@/lib/taxonomy-labels";
import { getSpaceAlbumGroups } from "@/lib/space-albums";
import coordinates from "@/lib/country-coordinates.json";

export function earthPageCopy(locale: Locale) {
  return {
    title: locale === "zh" ? "地球图集" : "Wallpaper Earth",
    description: locale === "zh" ? "转动地球，探索各国家和地区的必应壁纸图集。" : "Explore wallpaper collections around the world.",
  };
}

export function getEarthAlbums(locale: Locale) {
  const groups = new Map<string, { id: string; title: string; image: string; href: string }[]>();
  const wallpapers = getAllWallpapers(locale);
  const seen = new Set<string>();
  for (const item of wallpapers) {
    if (!item.imageId || seen.has(item.imageId)) continue;
    seen.add(item.imageId);
    for (const country of getImageTaxonomy(item)?.countries ?? []) {
      const images = groups.get(country) ?? [];
      images.push({ id: item.Ssd, title: item.ImageContent?.Title ?? "", image: toAbsoluteUrl(item.ImageContent?.Image?.Url), href: localizePath(locale, `/wallpaper/${item.Ssd}`) });
      groups.set(country, images);
    }
  }
  const albums = [...groups].map(([id, images]) => ({ id, label: taxonomyLabel(id, locale, "country"), coordinates: (coordinates as Record<string, number[]>)[id] ?? null, count: images.length, images: images.slice(0, 7), href: localizePath(locale, `?country=${id}`) })).sort((a, b) => b.count - a.count);
  const spaceAlbums = getSpaceAlbumGroups(wallpapers).map(group => ({
    id: `space-${group.id}`,
    label: taxonomyLabel(group.tag || "space", locale, group.tag ? "tag" : "category"),
    coordinates: null,
    count: group.items.length,
    images: group.items.slice(0, 7).map(item => ({ id: item.Ssd, title: item.ImageContent?.Title ?? "", image: toAbsoluteUrl(item.ImageContent?.Image?.Url), href: localizePath(locale, `/wallpaper/${item.Ssd}`) })),
    href: localizePath(locale, `?category=space${group.tag ? `&tag=${group.tag}` : ""}`),
  }));
  return { albums, spaceAlbums };
}
