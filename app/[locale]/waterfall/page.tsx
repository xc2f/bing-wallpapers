import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import LocaleSwitcher from "@/components/locale-switcher";
import ScrollRestorer from "@/components/scroll-restorer";
import ScrollToTopButton from "@/components/scroll-to-top-button";
import ThemeSwitcher from "@/components/theme-switcher";
import WaterfallGallery from "@/components/waterfall-gallery";
import YearFilterStrip from "@/components/year-filter-strip";
import {
  filterWallpapersByDate,
  getAllWallpapers,
  getYearOptions,
  toProxyImageUrl,
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

const WATERFALL_BATCH_SIZE = 180;

function createDetailHref(locale: Locale, ssd: string) {
  return localizePath(locale, `/wallpaper/${ssd}`);
}

function createWaterfallHref(
  locale: Locale,
  year?: string,
  mode?: string,
  page = 1
) {
  const params = new URLSearchParams();

  if (year?.trim()) {
    params.set("year", year.trim());
  }

  if (mode?.trim()) {
    params.set("mode", mode.trim());
  }

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
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = getLocaleFromParam(locale);
  const dictionary = getDictionary(resolvedLocale);

  return {
    title: `${dictionary.waterfallTitle} | ${dictionary.siteTitle}`,
    description: dictionary.waterfallDescription,
  };
}

export default async function LocalizedWaterfallPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
    searchParams?: Promise<{ mode?: string; page?: string; year?: string }>;
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
  const allWallpapers = getAllWallpapers();
  const mode = resolvedSearchParams.mode?.trim() ?? "";
  const year = resolvedSearchParams.year?.trim() ?? "";
  const requestedPage = Number.parseInt(resolvedSearchParams.page ?? "1", 10);
  const initialShowMeta = mode === "meta";
  const allowStoredPreference = !mode;
  const yearOptions = getYearOptions(allWallpapers);
  const wallpapers = filterWallpapersByDate(allWallpapers, year);
  const totalPages = Math.max(1, Math.ceil(wallpapers.length / WATERFALL_BATCH_SIZE));
  const currentPage = Number.isNaN(requestedPage)
    ? 1
    : Math.min(Math.max(1, requestedPage), totalPages);
  const loadedWallpapers = wallpapers.slice(0, currentPage * WATERFALL_BATCH_SIZE);
  const waterfallPath = createWaterfallHref(locale, year, mode, currentPage);
  const yearFilterItems = [
    {
      href: createWaterfallHref(locale, "", mode),
      label: dictionary.filterAllYears,
      active: !year,
    },
    ...yearOptions.map((optionYear) => ({
      href: createWaterfallHref(locale, optionYear, mode),
      label: optionYear,
      active: optionYear === year,
    })),
  ];
  const items = loadedWallpapers.map((wallpaper) => ({
    ssd: wallpaper.Ssd,
    fullDate: formatArchiveDate(locale, wallpaper.Ssd, wallpaper.FullDateString),
    title: wallpaper.ImageContent?.Title ?? dictionary.untitled,
    description: wallpaper.ImageContent?.Description ?? dictionary.noDescription,
    previewUrl: toProxyImageUrl(wallpaper.ImageContent?.Image?.Url),
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <section className="flex flex-col gap-6 pb-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <ThemeSwitcher
                initialMode={initialThemeMode}
                labels={{
                  system: dictionary.themeAuto,
                  light: dictionary.themeLight,
                  dark: dictionary.themeDark,
                }}
              />
              <LocaleSwitcher
                locale={locale}
                pathname="/waterfall"
                searchParams={resolvedSearchParams}
              />
            </div>
            <Link
              href={localizePath(locale)}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10"
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

        <div className="theme-waterfall-year-strip sticky top-4 z-20 -mx-2 rounded-[1.5rem] border border-white/10 bg-stone-950/78 px-2 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <YearFilterStrip
            allYearsLabel={dictionary.filterAllYears}
            currentYear={year}
            items={yearFilterItems}
          />
        </div>

        <WaterfallGallery
          dictionary={dictionary}
          allowStoredPreference={allowStoredPreference}
          initialPage={currentPage}
          items={items}
          initialShowMeta={initialShowMeta}
          locale={locale}
          storageKey={waterfallPath}
          totalCount={wallpapers.length}
          totalPages={totalPages}
          year={year}
        />
      </div>
    </main>
  );
}
