import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import FilterBar from "@/components/filter-bar";
import LocaleSwitcher from "@/components/locale-switcher";
import PreserveScrollLink from "@/components/preserve-scroll-link";
import ScrollRestorer from "@/components/scroll-restorer";
import ScrollToTopButton from "@/components/scroll-to-top-button";
import {
  filterWallpapersByDate,
  getAllWallpapers,
  getMonthOptions,
  getYearOptions,
  paginateWallpapers,
  searchWallpapers,
  toAbsoluteUrl,
} from "@/lib/archive";
import {
  getDictionary,
  getLocaleFromParam,
  isValidLocale,
  localizePath,
  locales,
  type Locale,
} from "@/lib/i18n";

function createPageHref(
  locale: Locale,
  page: number,
  query?: string,
  year?: string,
  month?: string
) {
  const params = new URLSearchParams();

  if (query?.trim()) params.set("q", query.trim());
  if (year?.trim()) params.set("year", year.trim());
  if (month?.trim()) params.set("month", month.trim());
  if (page > 1) params.set("page", String(page));

  const search = params.toString();
  return localizePath(locale, search ? `?${search}` : "");
}

function createDetailHref(locale: Locale, ssd: string) {
  return localizePath(locale, `/wallpaper/${ssd}`);
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
    title: dictionary.siteTitle,
    description: dictionary.siteDescription,
  };
}

export default async function LocalizedHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    q?: string;
    page?: string;
    year?: string;
    month?: string;
  }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    return null;
  }

  const resolvedParams = (await searchParams) ?? {};
  const query = resolvedParams.q?.trim() ?? "";
  const year = resolvedParams.year?.trim() ?? "";
  const month = resolvedParams.month?.trim() ?? "";
  const requestedPage = Number.parseInt(resolvedParams.page ?? "1", 10);
  const page = Number.isNaN(requestedPage) ? 1 : requestedPage;

  const dictionary = getDictionary(locale);
  const allWallpapers = getAllWallpapers();
  const yearOptions = getYearOptions(allWallpapers);
  const allMonthOptions = getMonthOptions(allWallpapers);
  const yearToMonths = Object.fromEntries(
    yearOptions.map((optionYear) => [
      optionYear,
      getMonthOptions(allWallpapers, optionYear),
    ])
  );
  const dateFilteredWallpapers = filterWallpapersByDate(allWallpapers, year, month);
  const filteredWallpapers = searchWallpapers(dateFilteredWallpapers, query);
  const { currentPage, totalPages, items } = paginateWallpapers(
    filteredWallpapers,
    page
  );
  const latestDate = allWallpapers[0]?.FullDateString ?? "N/A";
  const currentListPath = createPageHref(locale, currentPage, query, year, month);

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-10 text-stone-100 sm:px-6 lg:px-8">
      <ScrollRestorer storageKey={currentListPath} />
      <ScrollToTopButton label={dictionary.backToTop} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <section className="flex flex-col gap-6 border-b border-white/10 pb-10">
          <div className="flex items-center justify-end">
            <LocaleSwitcher
              locale={locale}
              pathname="/"
              searchParams={resolvedParams}
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">
                {dictionary.archiveLabel}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {dictionary.siteTitle}
              </h1>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 border-l border-white/10 pl-6 text-sm text-stone-400 sm:w-fit">
              <div>
                <dt className="uppercase tracking-[0.2em]">{dictionary.archived}</dt>
                <dd className="mt-1 text-base font-medium text-stone-100">
                  {allWallpapers.length}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.2em]">{dictionary.latest}</dt>
                <dd className="mt-1 text-base font-medium text-stone-100">
                  {latestDate}
                </dd>
              </div>
            </dl>
          </div>

          <FilterBar
            locale={locale}
            dictionary={dictionary}
            initialQuery={query}
            initialYear={year}
            initialMonth={month}
            yearOptions={yearOptions}
            allMonthOptions={allMonthOptions}
            yearToMonths={yearToMonths}
            resultSummary={
              <p>
                {dictionary.resultSummaryPrefix}{" "}
                <span className="text-stone-300">{filteredWallpapers.length}</span>{" "}
                {dictionary.resultSummaryMiddle}{" "}
                <span className="text-stone-300">{currentPage}</span>{" "}
                {dictionary.resultSummaryPageJoin}{" "}
                <span className="text-stone-300">{totalPages}</span>
                {dictionary.resultSummarySuffix}
              </p>
            }
            footer={
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={localizePath(locale, "/waterfall")}
                  aria-label={dictionary.viewWaterfall}
                  title={dictionary.viewWaterfall}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-400 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="h-4 w-4"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="1.5" y="2" width="5" height="5" stroke="currentColor" />
                    <rect x="9.5" y="2" width="5" height="5" stroke="currentColor" />
                    <rect x="1.5" y="9" width="5" height="5" stroke="currentColor" />
                    <rect x="9.5" y="9" width="5" height="5" stroke="currentColor" />
                  </svg>
                </Link>
              </div>
            }
          />
        </section>

        {items.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
            <h2 className="text-xl font-semibold text-white">{dictionary.emptyTitle}</h2>
            {/* <p className="mt-3 text-sm text-stone-300">
              {dictionary.emptyDescriptionPrefix}{" "}
              <code className="rounded bg-white/10 px-2 py-1">npm run save</code>{" "}
              {dictionary.emptyDescriptionSuffix}
            </p> */}
          </section>
        ) : (
          <>
            <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((wallpaper) => {
                const title = wallpaper.ImageContent?.Title ?? dictionary.untitled;
                const description =
                  wallpaper.ImageContent?.Description ?? dictionary.noDescription;
                const previewUrl = toAbsoluteUrl(wallpaper.ImageContent?.Image?.Url);

                return (
                  <article
                    key={wallpaper.Ssd}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20"
                  >
                    {previewUrl ? (
                      <PreserveScrollLink
                        href={createDetailHref(locale, wallpaper.Ssd)}
                        className="block overflow-hidden bg-stone-900"
                      >
                        <Image
                          src={previewUrl}
                          alt={title}
                          width={1920}
                          height={1080}
                          className="h-64 w-full object-cover transition duration-300 hover:scale-[1.02]"
                        />
                      </PreserveScrollLink>
                    ) : (
                      <div className="flex h-64 items-center justify-center bg-stone-900 text-sm text-stone-400">
                        {dictionary.noPreviewImage}
                      </div>
                    )}

                    <div className="flex flex-col gap-4 p-5">
                      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-stone-400">
                        <span>{wallpaper.FullDateString ?? wallpaper.Ssd}</span>
                        <span>{wallpaper.Ssd}</span>
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold leading-tight text-white">
                          <PreserveScrollLink
                            href={createDetailHref(
                              locale,
                              wallpaper.Ssd,
                              query,
                              year,
                              month,
                              currentPage
                            )}
                            className="transition hover:text-amber-200"
                          >
                            {title}
                          </PreserveScrollLink>
                        </h2>
                        <p className="mt-3 line-clamp-6 text-sm leading-6 text-stone-300">
                          {description}
                        </p>
                      </div>

                      <p className="text-sm text-stone-400">
                        {wallpaper.ImageContent?.Copyright ?? dictionary.unknownCopyright}
                      </p>
                    </div>
                  </article>
                );
              })}
            </section>

            <nav className="flex flex-col gap-3 border-t border-white/10 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-stone-400">{dictionary.paginationPageSize}</p>
              <div className="flex gap-3">
                <Link
                  href={createPageHref(locale, currentPage - 1, query, year, month)}
                  aria-disabled={currentPage <= 1}
                  className={`rounded-full px-4 py-2 transition ${
                    currentPage <= 1
                      ? "pointer-events-none border border-white/10 text-stone-600"
                      : "border border-white/15 text-white hover:bg-white/10"
                  }`}
                >
                  {dictionary.paginationPrev}
                </Link>
                <Link
                  href={createPageHref(locale, currentPage + 1, query, year, month)}
                  aria-disabled={currentPage >= totalPages}
                  className={`rounded-full px-4 py-2 transition ${
                    currentPage >= totalPages
                      ? "pointer-events-none border border-white/10 text-stone-600"
                      : "bg-amber-300 text-stone-950 hover:bg-amber-200"
                  }`}
                >
                  {dictionary.paginationNext}
                </Link>
              </div>
            </nav>
          </>
        )}
      </div>
    </main>
  );
}
