import Link from "next/link";
import type { Metadata } from "next";
import LocaleSwitcher from "@/components/locale-switcher";
import ScrollRestorer from "@/components/scroll-restorer";
import ScrollToTopButton from "@/components/scroll-to-top-button";
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

function createDetailHref(locale: Locale, ssd: string) {
  return localizePath(locale, `/wallpaper/${ssd}`);
}

function createWaterfallHref(locale: Locale, year?: string, mode?: string) {
  const params = new URLSearchParams();

  if (year?.trim()) {
    params.set("year", year.trim());
  }

  if (mode?.trim()) {
    params.set("mode", mode.trim());
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
    searchParams?: Promise<{ mode?: string; year?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  if (!isValidLocale(locale)) {
    return null;
  }

  const dictionary = getDictionary(locale);
  const allWallpapers = getAllWallpapers();
  const mode = resolvedSearchParams.mode?.trim() ?? "";
  const year = resolvedSearchParams.year?.trim() ?? "";
  const initialShowMeta = mode === "meta";
  const allowStoredPreference = !mode;
  const yearOptions = getYearOptions(allWallpapers);
  const wallpapers = filterWallpapersByDate(allWallpapers, year);
  const waterfallPath = createWaterfallHref(locale, year, mode);
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
  const items = wallpapers.map((wallpaper) => ({
    ssd: wallpaper.Ssd,
    fullDate: formatArchiveDate(locale, wallpaper.Ssd, wallpaper.FullDateString),
    title: wallpaper.ImageContent?.Title ?? dictionary.untitled,
    ...(initialShowMeta
      ? {
          description: wallpaper.ImageContent?.Description ?? dictionary.noDescription,
        }
      : {}),
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
        <section className="flex flex-col gap-6 border-b border-white/10 pb-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-end">
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

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">
                {dictionary.archiveLabel}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {dictionary.waterfallTitle}
              </h1>
            </div>

            <dl className="grid grid-cols-1 gap-y-3 border-l border-white/10 pl-6 text-sm text-stone-400 sm:w-fit">
              <div>
                <dt className="uppercase tracking-[0.2em]">{dictionary.archived}</dt>
                <dd className="mt-1 text-base font-medium text-stone-100">
                  {wallpapers.length}
                </dd>
              </div>
            </dl>
          </div>

        </section>

        <div className="sticky top-4 z-20 -mx-2 rounded-[1.5rem] border border-white/10 bg-stone-950/78 px-2 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <YearFilterStrip
            allYearsLabel={dictionary.filterAllYears}
            currentYear={year}
            items={yearFilterItems}
          />
        </div>

        <WaterfallGallery
          dictionary={dictionary}
          allowStoredPreference={allowStoredPreference}
          items={items}
          initialShowMeta={initialShowMeta}
          storageKey={waterfallPath}
        />
      </div>
    </main>
  );
}
