import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DetailAmbientBackground from "@/components/detail-ambient-background";
import DetailKeyboardNavigation from "@/components/detail-keyboard-navigation";
import DetailPrefetchLinks from "@/components/detail-prefetch-links";
import DetailRelatedStrip from "@/components/detail-related-strip";
import LocaleSwitcher from "@/components/locale-switcher";
import ScrollToTopButton from "@/components/scroll-to-top-button";
import SmartBackButton from "@/components/smart-back-button";
import ThemeSwitcher from "@/components/theme-switcher";
import {
  getAdjacentWallpapers,
  getAdjacentWallpapersFromList,
  getAllWallpapers,
  filterWallpapersByDate,
  getRelatedWallpapers,
  getRelatedWallpapersFromList,
  getWallpaperBySsd,
  searchWallpapers,
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

const DETAIL_STATIC_PRERENDER_LIMIT = 180;

function splitDescriptionIntoParagraphs(description: string) {
  const normalized = description.trim();

  if (!normalized) {
    return [];
  }

  const blocks = normalized
    .split(/\n{2,}/)
    .flatMap((block) =>
      block
        .split(/(?<=[.!?。！？])\s+/)
        .map((part) => part.trim())
        .filter(Boolean)
    );

  return blocks.length > 0 ? blocks : [normalized];
}

export async function generateStaticParams() {
  const recentWallpapers = getAllWallpapers().slice(0, DETAIL_STATIC_PRERENDER_LIMIT);

  return locales.flatMap((locale) =>
    recentWallpapers.map((wallpaper) => ({
      locale,
      ssd: wallpaper.Ssd,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; ssd: string }>;
}): Promise<Metadata> {
  const { locale, ssd } = await params;
  const resolvedLocale = getLocaleFromParam(locale);
  const dictionary = getDictionary(resolvedLocale);
  const wallpaper = getWallpaperBySsd(ssd);

  if (!wallpaper) {
    return {
      title: dictionary.metadataNotFound,
    };
  }

  const title = wallpaper.ImageContent?.Title ?? wallpaper.Ssd;
  const description =
    wallpaper.ImageContent?.Description ?? dictionary.metadataFallbackDescription;

  return {
    title: `${title} | ${dictionary.siteTitle}`,
    description,
  };
}

export default async function LocalizedWallpaperDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; ssd: string }>;
  searchParams?: Promise<{
    q?: string;
    page?: string;
    year?: string;
    month?: string;
    view?: string;
    mode?: string;
  }>;
}) {
  const { locale, ssd } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = resolvedSearchParams.q?.trim() ?? "";
  const year = resolvedSearchParams.year?.trim() ?? "";
  const month = resolvedSearchParams.month?.trim() ?? "";
  const view = resolvedSearchParams.view?.trim() ?? "";
  if (!isValidLocale(locale)) {
    notFound();
  }
  const currentLocale: Locale = locale;

  const dictionary = getDictionary(currentLocale);
  const cookieStore = await cookies();
  const initialThemeMode = normalizeThemeMode(
    cookieStore.get(THEME_COOKIE_KEY)?.value
  );
  const allWallpapers = getAllWallpapers();
  const filteredWallpapers = searchWallpapers(
    filterWallpapersByDate(allWallpapers, year, month),
    query
  );
  const wallpaper =
    filteredWallpapers.find((item) => item.Ssd === ssd) ?? getWallpaperBySsd(ssd);

  if (!wallpaper) {
    notFound();
  }

  const title = wallpaper.ImageContent?.Title ?? wallpaper.Ssd;
  const description =
    wallpaper.ImageContent?.Description ?? dictionary.noDescription;
  const descriptionParagraphs = splitDescriptionIntoParagraphs(description);
  const formattedDate = formatArchiveDate(
    currentLocale,
    wallpaper.Ssd,
    wallpaper.FullDateString
  );
  const previewUrl = toProxyImageUrl(wallpaper.ImageContent?.Image?.Url);
  const imageUrl = toProxyImageUrl(wallpaper.ImageContent?.Image?.Wallpaper);
  const downloadUrl = imageUrl || previewUrl;
  const hasFilteredMatch = filteredWallpapers.some((item) => item.Ssd === wallpaper.Ssd);
  const relatedWallpapers = hasFilteredMatch
    ? getRelatedWallpapersFromList(filteredWallpapers, wallpaper.Ssd, 8)
    : getRelatedWallpapers(wallpaper.Ssd, 8);
  const { previous, next } = hasFilteredMatch
    ? getAdjacentWallpapersFromList(filteredWallpapers, wallpaper.Ssd)
    : getAdjacentWallpapers(wallpaper.Ssd);
  const backQuery = new URLSearchParams();

  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (typeof value === "string" && value) {
      backQuery.set(key, value);
    }
  });

  const backHref =
    view === "waterfall"
      ? (() => {
          const waterfallQuery = new URLSearchParams(backQuery.toString());
          waterfallQuery.delete("view");
          waterfallQuery.delete("q");
          waterfallQuery.delete("month");
          const waterfallSearch = waterfallQuery.toString();

          return localizePath(
            currentLocale,
            `/waterfall${waterfallSearch ? `?${waterfallSearch}` : ""}`
          );
        })()
      : localizePath(
          currentLocale,
          backQuery.toString() ? `?${backQuery.toString()}` : ""
        );

  function createDetailHref(targetSsd: string) {
    const nextQuery = new URLSearchParams(backQuery.toString());
    const nextQueryString = nextQuery.toString();

    return localizePath(
      currentLocale,
      `/wallpaper/${targetSsd}${nextQueryString ? `?${nextQueryString}` : ""}`
    )
  }

  return (
    <DetailAmbientBackground imageUrl={previewUrl || imageUrl}>
      <DetailKeyboardNavigation
        previousHref={previous ? createDetailHref(previous.Ssd) : undefined}
        nextHref={next ? createDetailHref(next.Ssd) : undefined}
      />
      <DetailPrefetchLinks
        hrefs={[
          previous ? createDetailHref(previous.Ssd) : "",
          next ? createDetailHref(next.Ssd) : "",
        ]}
      />
      <main className="theme-detail-page min-h-screen bg-[linear-gradient(180deg,rgba(8,8,9,0.08),rgba(8,8,9,0.24)_24%,rgba(8,8,9,0.48)_100%)] px-4 py-10 text-stone-100 sm:px-6 lg:px-8">
        <ScrollToTopButton label={dictionary.backToTop} />
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
          <section className="flex flex-col gap-6 border-b border-white/10 pb-8">
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
                locale={currentLocale}
                pathname={`/wallpaper/${ssd}`}
                searchParams={resolvedSearchParams}
              />
            </div>
            <SmartBackButton
              fallbackHref={backHref}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              label={
                view === "waterfall"
                  ? dictionary.detailBackToWaterfall
                  : dictionary.detailBack
              }
            />
          </div>

          <div className="flex flex-col gap-3">
              <div className="max-w-5xl">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">
                {dictionary.detailLabel}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {title}
              </h1>
              {query ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-stone-300">
                    <span className="text-stone-500">{dictionary.activeQuery}</span>
                    <span className="font-medium text-white">{query}</span>
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          </section>

          <section className="theme-detail-panel overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] shadow-[0_30px_90px_rgba(0,0,0,0.3)] backdrop-blur-md">
          <div className="bg-stone-900/58">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt={title}
                width={1920}
                height={1080}
                priority
                className="h-[22rem] w-full object-cover sm:h-[28rem] lg:h-[34rem]"
              />
            ) : (
              <div className="flex min-h-[24rem] items-center justify-center text-stone-400">
                {dictionary.noPreviewImage}
              </div>
            )}
          </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-8">
            <div className="max-w-3xl">
              <h2 className="text-xs uppercase tracking-[0.22em] text-stone-500">
                {dictionary.detailDescription}
              </h2>
              <div className="detail-description-prose mt-5 max-w-2xl space-y-4">
                {descriptionParagraphs.map((paragraph, index) => (
                  <p
                    key={`${wallpaper.Ssd}-description-${index}`}
                    className="text-pretty"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

              <aside className="rounded-[1.5rem] border border-white/10 bg-black/12 backdrop-blur-sm p-5 lg:sticky lg:top-6 lg:self-start">
                <div className="grid gap-3 border-b border-white/10 pb-5">
                {downloadUrl ? (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-amber-300 px-4 py-2.5 text-sm font-medium text-stone-950 transition hover:bg-amber-200"
                  >
                    {dictionary.detailOpenFull}
                  </a>
                ) : null}
                {previewUrl ? (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    {dictionary.detailOpenPreview}
                  </a>
                ) : null}
                </div>

                <dl className="mt-3 flex flex-col text-sm">
                  <div className="grid gap-2 border-b border-white/10 py-3">
                    <dt className="text-xs uppercase tracking-[0.16em] text-stone-500">
                      {dictionary.detailCopyright}
                    </dt>
                    <dd className="leading-6 text-stone-200">
                    {wallpaper.ImageContent?.Copyright ?? dictionary.unknownCopyright}
                  </dd>
                </div>
                  <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3">
                    <dt className="text-xs uppercase tracking-[0.16em] text-stone-500">
                      {dictionary.detailDate}
                    </dt>
                    <dd className="text-right text-stone-200">
                    {formattedDate}
                  </dd>
                </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.16em] text-stone-500">
                      {dictionary.detailArchiveId}
                    </dt>
                    <dd className="font-mono text-right text-stone-300">
                      {wallpaper.Ssd}
                    </dd>
                  </div>
              </dl>
              </aside>
            </div>
          </section>

        {previous || next ? (
          <section className="grid gap-4 border-t border-white/10 pt-8 md:grid-cols-2">
            {next ? (
            <Link
              href={createDetailHref(next.Ssd)}
              replace
              className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition duration-300 hover:-translate-x-1 hover:bg-white/10"
            >
              <div className="grid min-h-[10rem] gap-0 grid-cols-[132px_minmax(0,1fr)]">
                <div className="relative h-full min-h-[10rem] overflow-hidden bg-stone-900">
                  {toProxyImageUrl(next.ImageContent?.Image?.Url) ? (
                    <Image
                      src={toProxyImageUrl(next.ImageContent?.Image?.Url)}
                      alt={next.ImageContent?.Title ?? next.Ssd}
                      width={1920}
                      height={1080}
                      sizes="132px"
                      quality={62}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <div className="flex flex-col justify-between p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      ← {dictionary.detailNewerShort}
                    </p>
                    <p className="mt-2 text-sm text-stone-400">
                      {formatArchiveDate(currentLocale, next.Ssd, next.FullDateString)}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-white">
                      {next.ImageContent?.Title ?? next.Ssd}
                    </h3>
                  </div>
                </div>
              </div>
            </Link>
            ) : <div aria-hidden="true" className="hidden md:block" />}

            {previous ? (
            <Link
              href={createDetailHref(previous.Ssd)}
              replace
              className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition duration-300 hover:translate-x-1 hover:bg-white/10"
            >
              <div className="grid min-h-[10rem] gap-0 grid-cols-[minmax(0,1fr)_132px]">
                <div className="flex flex-col justify-between p-5 text-right">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      {dictionary.detailOlderShort} →
                    </p>
                    <p className="mt-2 text-sm text-stone-400">
                      {formatArchiveDate(currentLocale, previous.Ssd, previous.FullDateString)}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-white">
                      {previous.ImageContent?.Title ?? previous.Ssd}
                    </h3>
                  </div>
                </div>
                <div className="relative h-full min-h-[10rem] overflow-hidden bg-stone-900">
                  {toProxyImageUrl(previous.ImageContent?.Image?.Url) ? (
                    <Image
                      src={toProxyImageUrl(previous.ImageContent?.Image?.Url)}
                      alt={previous.ImageContent?.Title ?? previous.Ssd}
                      width={1920}
                      height={1080}
                      sizes="132px"
                      quality={62}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
              </div>
            </Link>
            ) : <div aria-hidden="true" className="hidden md:block" />}
          </section>
        ) : null}

        <section className="flex flex-col gap-4 border-t border-white/10 pt-8">
          <h2 className="text-2xl font-semibold text-white">{dictionary.detailMore}</h2>

          <DetailRelatedStrip>
            {relatedWallpapers.map((item, index) => {
              const relatedTitle = item.ImageContent?.Title ?? item.Ssd;
              const relatedPreviewUrl = toProxyImageUrl(item.ImageContent?.Image?.Url);

              return (
                <Link
                  key={item.Ssd}
                  href={createDetailHref(item.Ssd)}
                  replace
                  className={`group ${
                    index >= 4 ? "hidden md:flex" : "flex"
                  } w-[16.5rem] shrink-0 snap-start overflow-hidden rounded-[1.375rem] border border-white/10 bg-white/[0.03] transition duration-300 hover:border-white/15 hover:bg-white/[0.06]`}
                >
                  <div className="relative h-[6.5rem] w-[6.5rem] shrink-0 overflow-hidden bg-stone-900">
                    {relatedPreviewUrl ? (
                      <Image
                        src={relatedPreviewUrl}
                        alt={relatedTitle}
                        width={1920}
                        height={1080}
                        sizes="104px"
                        quality={62}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-stone-400">
                        {dictionary.noPreviewImage}
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-3.5">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                      {formatArchiveDate(currentLocale, item.Ssd, item.FullDateString)}
                    </p>
                    <h3 className="line-clamp-2 text-[0.96rem] font-semibold leading-snug text-white">
                      {relatedTitle}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </DetailRelatedStrip>
        </section>
        </div>
      </main>
    </DetailAmbientBackground>
  );
}
