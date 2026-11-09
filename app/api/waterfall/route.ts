import { wallpaperFilterKeys } from "@/lib/wallpaper-filters";
import { NextRequest, NextResponse } from "next/server";
import {
  getFilteredWallpapers,
  toAbsoluteUrl,
} from "@/lib/archive";
import {
  formatArchiveDate,
  getDictionary,
  getLocaleFromParam,
  isValidLocale,
  localizePath,
  type Locale,
} from "@/lib/i18n";

import { waterfallPageWindow } from "@/lib/waterfall-pagination";

function createDetailHref(locale: Locale, ssd: string) {
  return localizePath(locale, `/wallpaper/${ssd}`);
}

export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get("locale")?.trim() ?? "";
  const filters = Object.fromEntries(wallpaperFilterKeys.map((key) => [key, request.nextUrl.searchParams.get(key)?.trim() ?? ""]));
  const pageValue = Number.parseInt(
    request.nextUrl.searchParams.get("page")?.trim() ?? "1",
    10
  );

  if (!isValidLocale(localeParam)) {
    return NextResponse.json({ error: "Invalid locale." }, { status: 400 });
  }

  const locale = getLocaleFromParam(localeParam);
  const dictionary = getDictionary(locale);
  const wallpapers = getFilteredWallpapers(locale, filters);
  const { page, totalPages, start, end } = waterfallPageWindow(wallpapers.length, pageValue);
  const items = wallpapers.slice(start, end).map((wallpaper) => ({
    ssd: wallpaper.Ssd,
    fullDate: formatArchiveDate(locale, wallpaper.Ssd, wallpaper.FullDateString),
    title: wallpaper.ImageContent?.Title ?? dictionary.untitled,
    copyright: wallpaper.ImageContent?.Copyright,
    description: wallpaper.ImageContent?.Description ?? dictionary.noDescription,
    previewUrl: toAbsoluteUrl(wallpaper.ImageContent?.Image?.Url),
    wallpaperUrl: toAbsoluteUrl(wallpaper.ImageContent?.Image?.Wallpaper),
    detailHref: createDetailHref(locale, wallpaper.Ssd),
  }));

  return NextResponse.json({
    items,
    page,
    totalCount: wallpapers.length,
    totalPages,
  }, { headers: { "Cache-Control": "public, max-age=60" } });
}
