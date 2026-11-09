import EarthGalleryLink from "@/components/earth-gallery-link";
import WaterfallFilters from "@/components/waterfall-filters";
import { getWallpaperFilters, wallpaperFilterParams, type WallpaperFilters } from "@/lib/wallpaper-filters";
import JsonLd from "@/components/json-ld";
import { pageMetadata, siteUrl } from "@/lib/seo";
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
  return localizePath(locale, search ? `?${search}` : "");
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
    path: "",
    title: dictionary.siteTitle,
    description: dictionary.siteDescription,
    noIndex: wallpaperFilterParams(filters).size > 0 || !getAllWallpapers(resolvedLocale).length,
  });
}

export default async function LocalizedHomePage({
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
  const latestDate = allWallpapers[0]
    ? formatArchiveDate(locale, allWallpapers[0].Ssd, allWallpapers[0].FullDateString)
    : dictionary.notAvailable;
  const items = loadedWallpapers.map((wallpaper) => ({
    ssd: wallpaper.Ssd,
    fullDate: formatArchiveDate(locale, wallpaper.Ssd, wallpaper.FullDateString),
    title: wallpaper.ImageContent?.Title ?? dictionary.untitled,
    copyright: wallpaper.ImageContent?.Copyright,
    description: wallpaper.ImageContent?.Description ?? dictionary.noDescription,
    previewUrl: toAbsoluteUrl(wallpaper.ImageContent?.Image?.Url),
    wallpaperUrl: toAbsoluteUrl(wallpaper.ImageContent?.Image?.Wallpaper),
    detailHref: createDetailHref(locale, wallpaper.Ssd),
  }));

  return (
    <main className="bg-stone-950 px-4 pb-10 pt-5 text-stone-100 sm:px-6 sm:pt-10 lg:px-8">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: dictionary.siteTitle,
        description: dictionary.siteDescription,
        url: siteUrl(localizePath(locale)),
        mainEntity: {
          "@type": "ItemList",
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem", position: start + index + 1,
            url: siteUrl(item.detailHref), name: item.title,
          })),
        },
      }} />
      <ScrollRestorer storageKey={waterfallPath} />
      <ScrollToTopButton
        label={dictionary.backToTop}
        showPosition
        totalCount={wallpapers.length}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 has-[[data-waterfall-wide=true]]:max-w-none">
        <section className="flex flex-col gap-4 pb-2 sm:gap-6">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <EarthGalleryLink locale={locale} />
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
            <div className="min-w-0">
              <LocaleSwitcher
                locale={locale}
                pathname="/"
                searchParams={Object.fromEntries(Object.entries(resolvedSearchParams).filter(([key]) => key !== "mode"))}
              />
            </div>
          </div>

          <div className="max-w-3xl">
              <p className="theme-eyebrow text-sm uppercase tracking-[0.3em]">
                {dictionary.archiveLabel}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                {dictionary.siteTitle}
              </h1>
              <p className="mt-4 text-sm leading-6 text-stone-400">{dictionary.siteDescription}</p>
              <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-400">
                <div className="inline-flex items-center gap-2">
                  <dt className="text-stone-500">{dictionary.archived}</dt>
                  <dd className="font-medium text-stone-100">{allWallpapers.length}</dd>
                </div>
                <div className="inline-flex items-center gap-2">
                  <dt className="text-stone-500">{dictionary.latest}</dt>
                  <dd className="font-medium text-stone-100">{latestDate}</dd>
                </div>
              </dl>
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
