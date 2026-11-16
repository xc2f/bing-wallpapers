import { getWallpaperBySsd, toAbsoluteUrl } from "@/lib/archive";
import { htmlLangMap, isValidLocale } from "@/lib/i18n";
import { wallpaperDocument } from "@/lib/wallpaper-document";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; ssd: string }> },
) {
  const { locale, ssd } = await params;
  if (!isValidLocale(locale)) return Response.json({ error: "Invalid locale." }, { status: 400 });

  const wallpaper = getWallpaperBySsd(ssd, locale);
  if (!wallpaper) return Response.json({ error: "Wallpaper not found." }, { status: 404 });
  if (wallpaper.Ssd !== ssd) {
    return new Response(null, { status: 308, headers: { Location: `/api/wallpapers/${locale}/${wallpaper.Ssd}` } });
  }

  const { location, ...document } = wallpaperDocument(wallpaper, locale);
  return Response.json({
    ssd: wallpaper.Ssd,
    locale,
    ...document,
    previewUrl: toAbsoluteUrl(wallpaper.ImageContent?.Image?.Url),
    location: location && {
      name: location.placeName || undefined,
      precision: location.exactPoint ? "exact" : "country",
      mapUrl: location.mapUrl,
      points: location.points.map(({ point: [longitude, latitude], label }) => ({ latitude, longitude, label })),
    },
  }, {
    headers: {
      "Content-Language": htmlLangMap[locale],
      "Cache-Control": "public, max-age=3600",
    },
  });
}
