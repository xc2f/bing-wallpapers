import { getWallpaperMapLocation, type WallpaperItem } from "@/lib/archive";
import type { MapPoint } from "@/lib/bing-map-location";
import countryCoordinates from "@/lib/country-coordinates.json";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getImageTaxonomy } from "@/lib/image-taxonomy";
import { taxonomyLabel } from "@/lib/taxonomy-labels";

const coordinates: Partial<Record<string, number[]>> = countryCoordinates;

export function wallpaperLocation(wallpaper: WallpaperItem, locale: Locale) {
  const dictionary = getDictionary(locale);
  const countries = getImageTaxonomy(wallpaper)?.countries;
  const mapLocation = getWallpaperMapLocation(wallpaper);
  const exactPoint = mapLocation?.point;
  const regions = [...new Set(countries)].flatMap((country) => {
    const coordinate = coordinates[country];
    if (!coordinate) return [];

    const point: MapPoint = [coordinate[0], coordinate[1]];
    return [{ point, label: taxonomyLabel(country, locale, "country") }];
  });
  const regionNames = new Intl.ListFormat(locale).format(regions.map(({ label }) => label));
  const points = exactPoint
    ? [{ point: exactPoint, label: mapLocation.label || regionNames || dictionary.detailLocation }]
    : regions;
  if (!points.length) return;

  const placeName = mapLocation?.label || regionNames;
  const locationLabel = exactPoint ? dictionary.detailLocation : dictionary.detailApproximateRegion;
  const mapUrl = exactPoint
    ? `https://www.openstreetmap.org/?mlat=${exactPoint[1]}&mlon=${exactPoint[0]}#map=12/${exactPoint[1]}/${exactPoint[0]}`
    : undefined;

  return { exactPoint, points, placeName, locationLabel, mapUrl };
}
