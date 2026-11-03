import TaxonomyBrowser from "@/components/taxonomy-browser";
import { filterWallpapersByTaxonomy, getImageTaxonomy } from "@/lib/image-taxonomy";
import { taxonomyLabel } from "@/lib/taxonomy-labels";
import { getSearchExamples } from "@/lib/search-examples";
import Image from "next/image";
import { pageMetadata, pageTitle, siteUrl } from "@/lib/seo";
import JsonLd from "@/components/json-ld";
import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import FilterBar from "@/components/filter-bar";
import ListPagination from "@/components/list-pagination";
import LocaleSwitcher from "@/components/locale-switcher";
import PreserveScrollLink from "@/components/preserve-scroll-link";
import ScrollRestorer from "@/components/scroll-restorer";
import ScrollToTopButton from "@/components/scroll-to-top-button";
import ThemeSwitcher from "@/components/theme-switcher";
import {
  filterWallpapersByDate,
  getSearchHighlightTerms,
  getAllWallpapers,
  getMonthOptions,
  getYearOptions,
  paginateWallpapers,
  searchWallpapers,
  toAbsoluteUrl,
} from "@/lib/archive";
import {
  formatArchiveDate,
  getDictionary,
  getLocaleFromParam,
  isValidLocale,
  localizePath,
  locales,
  type Locale,
} from "@/lib/i18n";
import { THEME_COOKIE_KEY, normalizeThemeMode } from "@/lib/theme";
import type { ReactNode } from "react";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, terms: string[]): ReactNode {
  if (!terms.length) {
    return text;
  }

  const pattern = terms.map(escapeRegExp).join("|");
  if (!pattern) {
    return text;
  }

  const segments = text.split(new RegExp(`(${pattern})`, "gi"));

  return segments.map((segment, index) => {
    const isMatch = terms.some((term) => segment.toLowerCase() === term.toLowerCase());

    if (!isMatch) {
      return <span key={`${segment}-${index}`}>{segment}</span>;
    }

    return (
      <mark
        key={`${segment}-${index}`}
        className="rounded bg-amber-300/20 px-0.5 text-amber-100"
      >
        {segment}
      </mark>
    );
  });
}

function createPageHref(
  locale: Locale,
  page: number,
  query?: string,
  year?: string,
  month?: string,
  category?: string,
  tag?: string
) {
  const params = new URLSearchParams();

  if (query?.trim()) params.set("q", query.trim());
  if (year?.trim()) params.set("year", year.trim());
  if (month?.trim()) params.set("month", month.trim());
  if (category) params.set("category", category);
  if (tag) params.set("tag", tag);
  if (page > 1) params.set("page", String(page));

  const search = params.toString();
  return localizePath(locale, search ? `?${search}` : "");
}

function createDetailHref(
  locale: Locale,
  ssd: string,
  query?: string,
  page?: number,
  year?: string,
  month?: string,
  category?: string,
  tag?: string
) {
  const params = new URLSearchParams();

  if (query?.trim()) params.set("q", query.trim());
  if (year?.trim()) params.set("year", year.trim());
  if (month?.trim()) params.set("month", month.trim());
  if (category) params.set("category", category);
  if (tag) params.set("tag", tag);
  if (page && page > 1) params.set("page", String(page));

  const search = params.toString();
  return localizePath(
    locale,
    `/wallpaper/${ssd}${search ? `?${search}` : ""}`
  );
}

function createWaterfallEntryHref(locale: Locale, year?: string, q?: string, month?: string, category?: string, tag?: string) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ q, year, month, category, tag })) {
    if (value?.trim()) params.set(key, value.trim());
  }
  return localizePath(locale, `/waterfall${params.size ? `?${params}` : ""}`);
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ q?: string; page?: string; year?: string; month?: string; category?: string; tag?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = getLocaleFromParam(locale);
  const dictionary = getDictionary(resolvedLocale);
  const filters = (await searchParams) ?? {};
  const query = filters.q?.trim() ?? "";
  const category = filters.category?.trim() ?? "";
  const tag = filters.tag?.trim() ?? "";
  const year = filters.year?.trim() ?? "";
  const month = filters.month?.trim() ?? "";
  const wallpapers = filterWallpapersByTaxonomy(searchWallpapers(filterWallpapersByDate(getAllWallpapers(resolvedLocale), year, month), query), category, tag);
  const requestedPage = Number.parseInt(filters.page ?? "1", 10);
  const { currentPage } = paginateWallpapers(wallpapers, Number.isNaN(requestedPage) ? 1 : requestedPage);
  const href = createPageHref(resolvedLocale, currentPage, query, year, month, category, tag);
  return pageMetadata({
    locale: resolvedLocale,
    path: href.slice(`/${resolvedLocale}`.length),
    title: pageTitle(resolvedLocale, dictionary.siteTitle, currentPage),
    description: dictionary.siteDescription,
    noIndex: Boolean(query || year || month || category || tag || !wallpapers.length),
  });
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
    category?: string;
    tag?: string;
  }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    return null;
  }

  const resolvedParams = (await searchParams) ?? {};
  const query = resolvedParams.q?.trim() ?? "";
  const category = resolvedParams.category?.trim() ?? "";
  const tag = resolvedParams.tag?.trim() ?? "";
  const year = resolvedParams.year?.trim() ?? "";
  const month = resolvedParams.month?.trim() ?? "";
  const requestedPage = Number.parseInt(resolvedParams.page ?? "1", 10);
  const page = Number.isNaN(requestedPage) ? 1 : requestedPage;

  const dictionary = getDictionary(locale);
  const cookieStore = await cookies();
  const initialThemeMode = normalizeThemeMode(
    cookieStore.get(THEME_COOKIE_KEY)?.value
  );
  const allWallpapers = getAllWallpapers(locale);
  const yearOptions = getYearOptions(allWallpapers);
  const yearToMonths = Object.fromEntries(
    yearOptions.map((optionYear) => [
      optionYear,
      getMonthOptions(allWallpapers, optionYear),
    ])
  );
  const dateFilteredWallpapers = filterWallpapersByDate(allWallpapers, year, month);
  const searchedWallpapers = searchWallpapers(dateFilteredWallpapers, query);
  const filteredWallpapers = filterWallpapersByTaxonomy(searchedWallpapers, category, tag);
  const highlightTerms = getSearchHighlightTerms(query);
  const { currentPage, totalPages, items } = paginateWallpapers(
    filteredWallpapers,
    page
  );
  const latestDate = allWallpapers[0]
    ? formatArchiveDate(locale, allWallpapers[0].Ssd, allWallpapers[0].FullDateString)
    : dictionary.notAvailable;
  const currentListPath = createPageHref(locale, currentPage, query, year, month, category, tag);

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-10 text-stone-100 sm:px-6 lg:px-8">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: dictionary.siteTitle,
        description: dictionary.siteDescription,
        url: siteUrl(currentListPath),
        mainEntity: {
          "@type": "ItemList",
          itemListElement: items.map((wallpaper, index) => ({
            "@type": "ListItem", position: index + 1,
            url: siteUrl(localizePath(locale, `/wallpaper/${wallpaper.Ssd}`)),
            name: wallpaper.ImageContent?.Title ?? wallpaper.Ssd,
          })),
        },
      }} />
      <ScrollRestorer storageKey={currentListPath} />
      <ScrollToTopButton label={dictionary.backToTop} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="flex flex-col gap-6 pb-2">
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
              pathname="/"
              searchParams={resolvedParams}
            />
          </div>

          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">
                {dictionary.archiveLabel}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
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

        <div>
          <FilterBar
            category={category}
            tag={tag}
            categoryLabel={category ? taxonomyLabel(category, locale, "category") : undefined}
            tagLabel={tag ? taxonomyLabel(tag, locale, "tag") : undefined}
            locale={locale}
            dictionary={dictionary}
            searchHelpExamples={getSearchExamples(dateFilteredWallpapers, locale)}
            initialQuery={query}
            initialYear={year}
            initialMonth={month}
            yearOptions={yearOptions}
            yearToMonths={yearToMonths}
            taxonomyFilters={
              <TaxonomyBrowser
                items={searchedWallpapers}
                locale={locale}
                filters={{ q: query, year, month, category, tag }}
              />
            }
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
                  href={createWaterfallEntryHref(locale, year, query, month, category, tag)}
                  aria-label={dictionary.viewWaterfall}
                  title={dictionary.viewWaterfall}
                  className="group inline-flex min-h-11 items-center gap-2.5 rounded-xl bg-amber-300 px-4 py-2.5 text-stone-950 shadow-sm transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--theme-app-rgb))]"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="h-5 w-5 shrink-0"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="1.5" y="1.5" width="5" height="7" rx="1" stroke="currentColor" />
                    <rect x="9.5" y="1.5" width="5" height="4" rx="1" stroke="currentColor" />
                    <rect x="1.5" y="11" width="5" height="3.5" rx="1" stroke="currentColor" />
                    <rect x="9.5" y="8" width="5" height="6.5" rx="1" stroke="currentColor" />
                  </svg>
                  <span className="text-sm font-semibold">
                    {dictionary.viewWaterfall}
                  </span>
                  <span
                    aria-hidden="true"
                    className="transition-transform motion-safe:group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </div>
            }
          />
        </div>

        {items.length === 0 ? (
          <section
            key={currentListPath}
            className="waterfall-view-stage rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center"
          >
            <h2 className="text-xl font-semibold text-white">{dictionary.emptyTitle}</h2>
          </section>
        ) : (
          <div key={currentListPath} className="waterfall-view-stage flex flex-col gap-6">
            <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((wallpaper, index) => {
                const title = wallpaper.ImageContent?.Title ?? dictionary.untitled;
                const description =
                  wallpaper.ImageContent?.Description ?? dictionary.noDescription;
                const previewUrl = toAbsoluteUrl(wallpaper.ImageContent?.Image?.Url);
                const prioritizeImage = index < 6;
                const wallpaperCategory = getImageTaxonomy(wallpaper)?.category;

                return (
                  <article
                    key={wallpaper.Ssd}
                    className="waterfall-card-reveal row-span-5 grid grid-rows-subgrid gap-y-0"
                    data-revealed="true"
                    style={{
                      transitionDelay: `${Math.min(index, 5) * 28}ms`,
                    }}
                  >
                    <div className="row-span-5 grid grid-rows-subgrid gap-y-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20">
                      {previewUrl ? (
                        <PreserveScrollLink
                          href={createDetailHref(
                            locale,
                            wallpaper.Ssd,
                            query,
                            page,
                            year,
                            month,
                            category,
                            tag
                          )}
                          className="block overflow-hidden bg-stone-900"
                        >
                          <div className="relative h-64 overflow-hidden bg-stone-900/80">
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-t from-black/16 to-transparent" />
                            <Image
                              referrerPolicy="no-referrer"
                              src={previewUrl}
                              alt={title}
                              width={1920}
                              height={1080}
                              priority={prioritizeImage}
                              loading={prioritizeImage ? "eager" : "lazy"}
                              sizes="(min-width: 1280px) 30vw, (min-width: 640px) 46vw, 96vw"
                              quality={68}
                              className="h-64 w-full object-cover transition duration-500 hover:scale-[1.012]"
                            />
                          </div>
                        </PreserveScrollLink>
                      ) : (
                        <div className="flex h-64 items-center justify-center bg-stone-900 text-sm text-stone-400">
                          {dictionary.noPreviewImage}
                        </div>
                      )}

                      <div className="row-span-4 grid grid-rows-subgrid gap-y-4 p-5">
                        <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.22em] text-stone-500">
                          <span>
                            {formatArchiveDate(locale, wallpaper.Ssd, wallpaper.FullDateString)}
                          </span>
                          {wallpaperCategory ? (
                            <span className="text-stone-400">{taxonomyLabel(wallpaperCategory, locale, "category")}</span>
                          ) : null}
                        </div>

                        <div className="contents">
                          <h2 className="min-h-[calc(2.4em+1rem)] border-t border-white/[0.06] pt-4 text-xl font-semibold leading-[1.2] text-white">
                            <PreserveScrollLink
                              href={createDetailHref(
                                locale,
                                wallpaper.Ssd,
                                query,
                                page,
                                year,
                                month,
                                category,
                                tag
                              )}
                              className="block break-words transition hover:text-amber-100"
                            >
                              {highlightText(title, highlightTerms.title)}
                            </PreserveScrollLink>
                          </h2>
                          <p className="line-clamp-3 text-sm leading-6 text-stone-400">
                            {highlightText(description, highlightTerms.description)}
                          </p>
                        </div>

                        <p className="line-clamp-2 text-xs leading-5 text-stone-500">
                          {wallpaper.ImageContent?.Copyright ?? dictionary.unknownCopyright}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <nav className="flex flex-col items-center gap-3 border-t border-white/10 pt-6 text-sm sm:flex-row sm:justify-between">
              <p className="inline-flex min-h-10 items-center text-stone-400">
                {dictionary.paginationPageSize}
              </p>
              <ListPagination
                currentPage={currentPage}
                totalPages={totalPages}
                prevHref={createPageHref(locale, currentPage - 1, query, year, month, category, tag)}
                nextHref={createPageHref(locale, currentPage + 1, query, year, month, category, tag)}
                prevLabel={dictionary.paginationPrev}
                nextLabel={dictionary.paginationNext}
              />
            </nav>
          </div>
        )}
      </div>
    </main>
  );
}
