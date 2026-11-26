import { getAllWallpapers, getWallpaperMapLocation, toAbsoluteUrl } from "@/lib/archive";
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
  type AlbumImage = { id: string; title: string; image: string; href: string };
  const countryGroups = new Map<string, AlbumImage[]>();
  const locationGroups = new Map<string, { label: string; point: number[]; country?: string; images: AlbumImage[] }>();
  const wallpapers = getAllWallpapers(locale);
  const seen = new Set<string>();
  for (const item of wallpapers) {
    if (!item.imageId || seen.has(item.imageId)) continue;
    seen.add(item.imageId);
    const image = { id: item.Ssd, title: item.ImageContent?.Title ?? "", image: toAbsoluteUrl(item.ImageContent?.Image?.Url), href: localizePath(locale, `/wallpaper/${item.Ssd}`) };
    const countries = getImageTaxonomy(item)?.countries ?? [];
    for (const country of countries) {
      const images = countryGroups.get(country) ?? [];
      images.push(image);
      countryGroups.set(country, images);
    }
    const mapLocation = getWallpaperMapLocation(item);
    if (mapLocation) {
      // Coordinates are rounded to ~11 m so repeated records for one place share a marker.
      const point = mapLocation.point;
      const key = `${point[0].toFixed(4)},${point[1].toFixed(4)}`;
      const group = locationGroups.get(key) ?? {
        label: mapLocation.label || countries.map(country => taxonomyLabel(country, locale, "country")).join(", "),
        point,
        country: countries[0],
        images: [],
      };
      group.images.push(image);
      locationGroups.set(key, group);
    }
  }
  const albums = [
    ...[...locationGroups].map(([key, group]) => ({
      id: `location-${key.replace(/[.,]/g, "-")}`,
      label: group.label,
      coordinates: group.point,
      coordinateType: "precise" as const,
      countryId: group.country,
      count: group.images.length,
      images: group.images,
      href: localizePath(locale, group.country ? `?country=${group.country}` : `/wallpaper/${group.images[0].id}`),
    })),
    ...[...countryGroups].map(([id, images]) => ({ id, label: taxonomyLabel(id, locale, "country"), coordinates: (coordinates as Record<string, number[]>)[id] ?? null, coordinateType: "country" as const, countryId: id, count: images.length, images, href: localizePath(locale, `?country=${id}`) })),
  ].sort((a, b) => b.count - a.count);
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
