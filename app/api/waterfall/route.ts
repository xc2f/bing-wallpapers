import { NextRequest, NextResponse } from "next/server";
import {
  filterWallpapersByDate,
  getAllWallpapers,
  toProxyImageUrl,
} from "@/lib/archive";
import {
  formatArchiveDate,
  getDictionary,
  getLocaleFromParam,
  isValidLocale,
  localizePath,
  type Locale,
} from "@/lib/i18n";

export const dynamic = "force-dynamic";

const WATERFALL_BATCH_SIZE = 180;

function createDetailHref(locale: Locale, ssd: string) {
  return localizePath(locale, `/wallpaper/${ssd}`);
}

export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get("locale")?.trim() ?? "";
  const year = request.nextUrl.searchParams.get("year")?.trim() ?? "";
  const pageValue = Number.parseInt(
    request.nextUrl.searchParams.get("page")?.trim() ?? "1",
    10
  );

  if (!isValidLocale(localeParam)) {
    return NextResponse.json({ error: "Invalid locale." }, { status: 400 });
  }

  const locale = getLocaleFromParam(localeParam);
  const dictionary = getDictionary(locale);
  const allWallpapers = await getAllWallpapers();
  const wallpapers = filterWallpapersByDate(allWallpapers, year);
  const totalPages = Math.max(1, Math.ceil(wallpapers.length / WATERFALL_BATCH_SIZE));
  const page = Number.isNaN(pageValue)
    ? 1
    : Math.min(Math.max(1, pageValue), totalPages);
  const start = (page - 1) * WATERFALL_BATCH_SIZE;
  const items = wallpapers.slice(start, start + WATERFALL_BATCH_SIZE).map((wallpaper) => ({
    ssd: wallpaper.Ssd,
    fullDate: formatArchiveDate(locale, wallpaper.Ssd, wallpaper.FullDateString),
    title: wallpaper.ImageContent?.Title ?? dictionary.untitled,
    description: wallpaper.ImageContent?.Description ?? dictionary.noDescription,
    previewUrl: toProxyImageUrl(wallpaper.ImageContent?.Image?.Url),
    detailHref: createDetailHref(locale, wallpaper.Ssd),
  }));

  return NextResponse.json({
    items,
    page,
    totalCount: wallpapers.length,
    totalPages,
  });
}
