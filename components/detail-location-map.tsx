import DetailMapViewport from "@/components/detail-map-viewport";
import type { WallpaperItem } from "@/lib/archive";
import { getDictionary, type Locale } from "@/lib/i18n";
import { wallpaperLocation } from "@/lib/wallpaper-location";

export default function DetailLocationMap({ wallpaper, locale }: {
  wallpaper: WallpaperItem;
  locale: Locale;
}) {
  const dictionary = getDictionary(locale);
  const location = wallpaperLocation(wallpaper, locale);
  if (!location) return null;
  const { exactPoint, points, placeName, locationLabel, mapUrl } = location;

  // Match the equirectangular viewBox of the static map.
  const positions = points.map(({ point: [longitude, latitude], label }) => ({
    x: (longitude + 185) / 370,
    y: (95 - latitude) / 190,
    label,
  }));
  const xs = positions.map(({ x }) => x);
  const ys = positions.map(({ y }) => y);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const zoom = Math.max(1, Math.min(exactPoint ? 3.5 : 2.75, 0.72 / span));
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;


  return (
    <figure className="detail-location-map min-w-0 overflow-hidden rounded-2xl lg:col-span-2">
      <DetailMapViewport
        key={wallpaper.Ssd}
        positions={positions}
        approximateLabel={exactPoint ? undefined : dictionary.detailApproximateRegion}
        initialView={{ x: centerX, y: centerY, zoom }}
        labels={{
          map: dictionary.detailLocation,
          zoomIn: dictionary.detailMapZoomIn,
          zoomOut: dictionary.detailMapZoomOut,
          reset: dictionary.detailMapReset,
        }}
      />
      <figcaption className="detail-location-map-caption flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 flex-1 basis-28 items-center gap-2.5">
          <span aria-hidden="true" className="detail-location-map-caption-icon grid size-9 shrink-0 place-items-center rounded-full">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z" />
              <circle cx="12" cy="10" r="2.25" />
            </svg>
          </span>
          <div className="min-w-0 break-words">
            {placeName ? <p className="text-xs text-stone-400">{locationLabel}</p> : null}
            <h2 className="text-sm font-semibold leading-snug text-stone-100">{placeName || locationLabel}</h2>
          </div>
        </div>
        {mapUrl ? (
          <a
            href={mapUrl}
            className="detail-location-map-link inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-1 text-xs underline-offset-4 hover:underline focus-visible:underline"
            target="_blank"
            rel="noreferrer"
          >
            OpenStreetMap
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 11l6-6M6 5h5v5" />
            </svg>
          </a>
        ) : null}
      </figcaption>
    </figure>
  );
}
