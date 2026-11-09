import WaterfallFilters from "@/components/waterfall-filters";
import { getWallpaperFilters, wallpaperFilterParams, type WallpaperFilters } from "@/lib/wallpaper-filters";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import LocaleSwitcher from "@/components/locale-switcher";
import ScrollRestorer from "@/components/scroll-restorer";
import ScrollToTopButton from "@/components/scroll-to-top-button";
import ThemeSwitcher from "@/components/theme-switcher";
import WaterfallGallery from "@/components/waterfall-gallery";
import {
  getAllWallpapers,
  getFilteredWallpapers,
  toAbsoluteUrl,
} from "@/lib/archive";
import {
  formatArchiveDate,
  getDictionary,
  getLocaleFromParam,
  isValidLocale,
  locales,
  localizePath,
  type Locale,
} from "@/lib/i18n";
import { THEME_COOKIE_KEY, normalizeThemeMode } from "@/lib/theme";

import { waterfallPageWindow } from "@/lib/waterfall-pagination";

function createDetailHref(locale: Locale, ssd: string) {
  return localizePath(locale, `/wallpaper/${ssd}`);
}

function createWaterfallHref(
  locale: Locale,
  filters: WallpaperFilters = {},
  page = 1
) {
  const params = wallpaperFilterParams(filters);

  if (page > 1) {
    params.set("page", String(page));
  }

  const search = params.toString();
  return localizePath(locale, `/waterfall${search ? `?${search}` : ""}`);
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<WallpaperFilters & { page?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = getLocaleFromParam(locale);
  const dictionary = getDictionary(resolvedLocale);

  const filters = getWallpaperFilters((await searchParams) ?? {});

  return pageMetadata({
    locale: resolvedLocale,
    path: "/waterfall",
    title: `${dictionary.waterfallTitle} | ${dictionary.siteTitle}`,
    description: dictionary.waterfallDescription,
    noIndex: wallpaperFilterParams(filters).size > 0,
  });
}

export default async function LocalizedWaterfallPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<WallpaperFilters & { page?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  if (!isValidLocale(locale)) {
    return null;
  }

  const dictionary = getDictionary(locale);
  const cookieStore = await cookies();
  const initialThemeMode = normalizeThemeMode(
    cookieStore.get(THEME_COOKIE_KEY)?.value
  );
  const allWallpapers = getAllWallpapers(locale);
  const filters = getWallpaperFilters(resolvedSearchParams);
  const requestedPage = Number.parseInt(resolvedSearchParams.page ?? "1", 10);
  const searchedWallpapers = getFilteredWallpapers(locale, { q: filters.q, year: filters.year, month: filters.month });
  const wallpapers = getFilteredWallpapers(locale, filters);
  const { page: currentPage, totalPages, start, end } = waterfallPageWindow(wallpapers.length, requestedPage);
  const loadedWallpapers = wallpapers.slice(start, end);
  const waterfallPath = createWaterfallHref(locale, filters, currentPage);
  const archiveParams = wallpaperFilterParams(filters);
  const archiveHref = localizePath(locale, archiveParams.size ? `?${archiveParams}` : "");
  const items = loadedWallpapers.map((wallpaper) => ({
    ssd: wallpaper.Ssd,
    fullDate: formatArchiveDate(locale, wallpaper.Ssd, wallpaper.FullDateString),
    title: wallpaper.ImageContent?.Title ?? dictionary.untitled,
    description: wallpaper.ImageContent?.Description ?? dictionary.noDescription,
    previewUrl: toAbsoluteUrl(wallpaper.ImageContent?.Image?.Url),
    wallpaperUrl: toAbsoluteUrl(wallpaper.ImageContent?.Image?.Wallpaper),
    detailHref: createDetailHref(locale, wallpaper.Ssd),
  }));

  return (
    <main className="bg-stone-950 px-4 pb-10 pt-5 text-stone-100 sm:px-6 sm:pt-10 lg:px-8">
      <ScrollRestorer storageKey={waterfallPath} />
      <ScrollToTopButton
        label={dictionary.backToTop}
        showPosition
        totalCount={wallpapers.length}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-10 has-[[data-waterfall-wide=true]]:max-w-none">
        <section className="flex flex-col gap-4 pb-2 sm:gap-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <Link
              href={archiveHref}
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white transition theme-button-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              <span aria-hidden="true" className="text-sm leading-none">
                ←
              </span>
              {dictionary.waterfallBack}
            </Link>
            <ThemeSwitcher
              initialMode={initialThemeMode}
              labels={{
                trigger: dictionary.themeLabel,
                dialog: dictionary.themeDialogLabel,
                system: dictionary.themeAuto,
                light: dictionary.themeLight,
                dark: dictionary.themeDark,
              }}
            />
            <div className="col-span-2 min-w-0 justify-self-end sm:col-span-1">
              <LocaleSwitcher
                locale={locale}
                pathname="/waterfall"
                searchParams={Object.fromEntries(Object.entries(resolvedSearchParams).filter(([key]) => key !== "mode"))}
              />
            </div>
          </div>

          <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">
                {dictionary.archiveLabel}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                {dictionary.waterfallTitle}
              </h1>
          </div>

        </section>

        <WaterfallFilters
          locale={locale}
          filters={filters}
          allWallpapers={allWallpapers}
          items={searchedWallpapers}
        />

        {wallpapers.length === 0 ? <p className="py-12 text-center text-stone-400">{dictionary.emptyTitle}</p> : null}
        <WaterfallGallery
          key={`${locale}:${wallpaperFilterParams(filters).toString()}`}
          dictionary={dictionary}
          initialPage={currentPage}
          items={items}
          locale={locale}
          storageKey={waterfallPath}
          totalCount={wallpapers.length}
          totalPages={totalPages}
          filters={filters}
        />
      </div>
    </main>
  );
}
