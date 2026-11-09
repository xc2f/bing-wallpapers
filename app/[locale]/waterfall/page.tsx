import { permanentRedirect } from "next/navigation";
import { isValidLocale, localizePath } from "@/lib/i18n";
import { getWallpaperFilters, wallpaperFilterParams } from "@/lib/wallpaper-filters";

export default async function LegacyWaterfallPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const search = (await searchParams) ?? {};
  const values = Object.fromEntries(Object.entries(search).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  const query = wallpaperFilterParams(getWallpaperFilters(values));
  const page = Number.parseInt(values.page ?? "1", 10);
  if (page > 1) query.set("page", String(page));
  permanentRedirect(localizePath(locale, query.size ? `?${query}` : ""));
}
