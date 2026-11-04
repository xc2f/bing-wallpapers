import TaxonomyBrowser from "@/components/taxonomy-browser";
import WaterfallFilters from "@/components/waterfall-filters";
import { filterWallpapersByTaxonomy } from "@/lib/image-taxonomy";
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
import { taxonomyUiLabel } from "@/lib/taxonomy-ui-labels";
import YearFilterStrip from "@/components/year-filter-strip";
import {
  filterWallpapersByDate,
  getAllWallpapers,
  searchWallpapers,
  getYearOptions,
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

import { WATERFALL_BATCH_SIZE } from "@/lib/waterfall-pagination";

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
  const year = filters.year ?? "";
  const requestedPage = Number.parseInt(resolvedSearchParams.page ?? "1", 10);
  const yearOptions = getYearOptions(allWallpapers);
  const searchedWallpapers = searchWallpapers(filterWallpapersByDate(allWallpapers, year, filters.month), filters.q ?? "");
  const wallpapers = filterWallpapersByTaxonomy(searchedWallpapers, filters.category, filters.tag, filters.country);
  const totalPages = Math.max(1, Math.ceil(wallpapers.length / WATERFALL_BATCH_SIZE));
  const currentPage = Number.isNaN(requestedPage)
    ? 1
    : Math.min(Math.max(1, requestedPage), totalPages);
  const loadedWallpapers = wallpapers.slice(0, currentPage * WATERFALL_BATCH_SIZE);
  const waterfallPath = createWaterfallHref(locale, filters, currentPage);
  const yearLabel = taxonomyUiLabel("years", locale);
  const yearFilterItems = [
    {
      href: createWaterfallHref(locale, { q: filters.q }),
      label: taxonomyUiLabel("all", locale),
      active: !year,
    },
    ...yearOptions.map((optionYear) => ({
      href: createWaterfallHref(locale, { q: filters.q, year: optionYear }),
      label: optionYear,
      active: optionYear === year,
    })),
  ];
  const archiveParams = wallpaperFilterParams(filters);
  const archiveHref = localizePath(locale, archiveParams.size ? `?${archiveParams}` : "");
  const items = loadedWallpapers.map((wallpaper) => ({
    ssd: wallpaper.Ssd,
    fullDate: formatArchiveDate(locale, wallpaper.Ssd, wallpaper.FullDateString),
    title: wallpaper.ImageContent?.Title ?? dictionary.untitled,
    description: wallpaper.ImageContent?.Description ?? dictionary.noDescription,
    previewUrl: toAbsoluteUrl(wallpaper.ImageContent?.Image?.Url),
    detailHref: createDetailHref(locale, wallpaper.Ssd),
  }));

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-10 text-stone-100 sm:px-6 lg:px-8">
      <ScrollRestorer storageKey={waterfallPath} />
      <ScrollToTopButton
        label={dictionary.backToTop}
        showPosition
        totalCount={wallpapers.length}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 has-[[data-waterfall-wide=true]]:max-w-none">
        <section className="flex flex-col gap-6 pb-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-end gap-3">
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
              <LocaleSwitcher
                locale={locale}
                pathname="/waterfall"
                searchParams={Object.fromEntries(Object.entries(resolvedSearchParams).filter(([key]) => key !== "mode"))}
              />
            </div>
            <Link
              href={archiveHref}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white transition theme-button-hover"
            >
              <span aria-hidden="true" className="text-sm leading-none">
                ←
              </span>
              {dictionary.waterfallBack}
            </Link>
          </div>

          <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">
                {dictionary.archiveLabel}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {dictionary.waterfallTitle}
              </h1>
          </div>

        </section>

        <WaterfallFilters
          locale={locale}
          yearFilters={<YearFilterStrip label={yearLabel} currentYear={year} items={yearFilterItems} />}
          countries={<TaxonomyBrowser items={searchedWallpapers} locale={locale} filters={filters} pathname="/waterfall" fields={["country"]} />}
          categories={<TaxonomyBrowser items={searchedWallpapers} locale={locale} filters={filters} pathname="/waterfall" fields={["category"]} />}
          tags={<TaxonomyBrowser items={searchedWallpapers} locale={locale} filters={filters} pathname="/waterfall" fields={["tag"]} />}
        />

        {wallpapers.length === 0 ? <p className="py-12 text-center text-stone-400">{dictionary.emptyTitle}</p> : null}
        <WaterfallGallery
          key={wallpaperFilterParams(filters).toString()}
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
