import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import LocaleSwitcher from "@/components/locale-switcher";
import ScrollToTopButton from "@/components/scroll-to-top-button";
import SmartBackButton from "@/components/smart-back-button";
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
  getDictionary,
  getLocaleFromParam,
  isValidLocale,
  locales,
  localizePath,
  type Locale,
} from "@/lib/i18n";

export async function generateStaticParams() {
  return locales.flatMap((locale) =>
    getAllWallpapers().map((wallpaper) => ({
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
  const mode = resolvedSearchParams.mode?.trim() ?? "";
  if (!isValidLocale(locale)) {
    notFound();
  }
  const currentLocale: Locale = locale;

  const dictionary = getDictionary(currentLocale);
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
  const previewUrl = toProxyImageUrl(wallpaper.ImageContent?.Image?.Url);
  const imageUrl = toProxyImageUrl(wallpaper.ImageContent?.Image?.Wallpaper);
  const downloadUrl = imageUrl || previewUrl;
  const hasFilteredMatch = filteredWallpapers.some((item) => item.Ssd === wallpaper.Ssd);
  const relatedWallpapers = hasFilteredMatch
    ? getRelatedWallpapersFromList(filteredWallpapers, wallpaper.Ssd, 3)
    : getRelatedWallpapers(wallpaper.Ssd, 3);
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
      ? localizePath(
          currentLocale,
          mode ? `/waterfall?mode=${mode}` : "/waterfall"
        )
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
    <main className="min-h-screen bg-stone-950 px-4 py-10 text-stone-100 sm:px-6 lg:px-8">
      <ScrollToTopButton label={dictionary.backToTop} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <section className="flex flex-col gap-6 border-b border-white/10 pb-8">
          <div className="relative flex items-center justify-end">
            <SmartBackButton
              fallbackHref={backHref}
              className="absolute left-0 -top-2 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              label={dictionary.detailBack}
            />
            <LocaleSwitcher
              locale={currentLocale}
              pathname={`/wallpaper/${ssd}`}
              searchParams={resolvedSearchParams}
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
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

            <dl className="grid grid-cols-1 gap-y-3 border-l border-white/10 pl-6 text-sm text-stone-400 sm:w-fit">
              <div>
                <dt className="uppercase tracking-[0.2em]">{dictionary.detailDate}</dt>
                <dd className="mt-1 text-base font-medium text-stone-100">
                  {wallpaper.FullDateString ?? wallpaper.Ssd}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.2em]">
                  {dictionary.detailArchiveId}
                </dt>
                <dd className="mt-1 font-mono text-sm text-white">{wallpaper.Ssd}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
          <div className="bg-stone-900">
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
            <div>
              <h2 className="text-lg font-semibold text-white">
                {dictionary.detailDescription}
              </h2>
              <p className="mt-4 text-sm leading-7 text-stone-300">{description}</p>
            </div>

            <aside className="rounded-[1.5rem] border border-white/10 bg-black/10 p-5">
              <h2 className="text-lg font-semibold text-white">{dictionary.detailInfo}</h2>
              <dl className="mt-4 flex flex-col gap-4 text-sm text-stone-300">
                <div>
                  <dt className="text-stone-400">{dictionary.detailTitle}</dt>
                  <dd className="mt-1 text-white">{title}</dd>
                </div>
                <div>
                  <dt className="text-stone-400">{dictionary.detailCopyright}</dt>
                  <dd className="mt-1">
                    {wallpaper.ImageContent?.Copyright ?? dictionary.unknownCopyright}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-400">{dictionary.detailDate}</dt>
                  <dd className="mt-1">
                    {wallpaper.FullDateString ?? wallpaper.Ssd}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                {downloadUrl ? (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-amber-300 px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-amber-200"
                  >
                    {dictionary.detailOpenFull}
                  </a>
                ) : null}
                {previewUrl ? (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    {dictionary.detailOpenPreview}
                  </a>
                ) : null}
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 border-t border-white/10 pt-8 md:grid-cols-2">
          {previous ? (
            <Link
              href={createDetailHref(previous.Ssd)}
              replace
              className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                {dictionary.detailOlder}
              </p>
              <p className="mt-2 text-sm text-stone-400">
                {previous.FullDateString ?? previous.Ssd}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {previous.ImageContent?.Title ?? previous.Ssd}
              </h3>
            </Link>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 p-5 text-sm text-stone-500">
              {dictionary.detailOlder}
            </div>
          )}

          {next ? (
            <Link
              href={createDetailHref(next.Ssd)}
              replace
              className="rounded-3xl border border-white/10 bg-white/5 p-5 text-right transition hover:bg-white/10"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                {dictionary.detailNewer}
              </p>
              <p className="mt-2 text-sm text-stone-400">
                {next.FullDateString ?? next.Ssd}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {next.ImageContent?.Title ?? next.Ssd}
              </h3>
            </Link>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 p-5 text-right text-sm text-stone-500">
              {dictionary.detailNewer}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 border-t border-white/10 pt-8">
          <h2 className="text-2xl font-semibold text-white">{dictionary.detailMore}</h2>

          <div className="grid gap-6 md:grid-cols-3">
            {relatedWallpapers.map((item) => {
              const relatedTitle = item.ImageContent?.Title ?? item.Ssd;
              const relatedPreviewUrl = toProxyImageUrl(item.ImageContent?.Image?.Url);

              return (
                <Link
                  key={item.Ssd}
                  href={createDetailHref(item.Ssd)}
                  replace
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:bg-white/10"
                >
                  {relatedPreviewUrl ? (
                    <Image
                      src={relatedPreviewUrl}
                      alt={relatedTitle}
                      width={1920}
                      height={1080}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-stone-900 text-sm text-stone-400">
                      {dictionary.noPreviewImage}
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      {item.FullDateString ?? item.Ssd}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {relatedTitle}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
