import detailIndexManifest from "@/db/detail-index-manifest.json";
import { DetailBrowseProvider } from "@/components/detail-browse-context";
import DetailBrowseHeader from "@/components/detail-browse-header";
import DetailBrowseNavigation from "@/components/detail-browse-navigation";
import { getImageTaxonomy } from "@/lib/image-taxonomy";
import DetailTaxonomy from "@/components/detail-taxonomy";
import TranslationNotice from "@/components/translation-notice";
import Image from "next/image";
import { pageMetadata, siteUrl } from "@/lib/seo";
import JsonLd from "@/components/json-ld";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import DetailAmbientBackground from "@/components/detail-ambient-background";
import ScrollToTopButton from "@/components/scroll-to-top-button";
import {
  getAdjacentWallpapers,
  getAllWallpapers,
  getRelatedWallpapers,
  getWallpaperBySsd,
  getTranslationSource,
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

// All known detail pages are generated at build time. Unknown IDs return 404.
export const dynamicParams = false;

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
  return locales.flatMap((locale) =>
    getAllWallpapers(locale).map((wallpaper) => ({
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
  const wallpaper = getWallpaperBySsd(ssd, resolvedLocale);

  if (!wallpaper) {
    return {
      title: dictionary.metadataNotFound,
      robots: { index: false, follow: true },
    };
  }

  const title = wallpaper.ImageContent?.Title ?? wallpaper.Ssd;
  const description =
    wallpaper.ImageContent?.Description ?? dictionary.metadataFallbackDescription;

  const image = toAbsoluteUrl(wallpaper.ImageContent?.Image?.Url);
  const path = `/wallpaper/${wallpaper.Ssd}`;
  const metadata = pageMetadata({
    locale: resolvedLocale,
    path,
    title: `${title} | ${dictionary.siteTitle}`,
    description,
    image: image ? { url: image, alt: title } : undefined,
  });
  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      types: { "text/plain": siteUrl(localizePath(resolvedLocale, `${path}/text`)) },
    },
  };
}

export default async function LocalizedWallpaperDetailPage({ params }: {
  params: Promise<{ locale: string; ssd: string }>;
}) {
  const { locale, ssd } = await params;
  if (!isValidLocale(locale)) notFound();
  const currentLocale: Locale = locale;
  const dictionary = getDictionary(currentLocale);
  const wallpaper = getWallpaperBySsd(ssd, currentLocale);
  if (!wallpaper) notFound();
  if (wallpaper.Ssd !== ssd) permanentRedirect(localizePath(currentLocale, `/wallpaper/${wallpaper.Ssd}`));
  const initialNavigation = {
    ...getAdjacentWallpapers(ssd, currentLocale),
    related: getRelatedWallpapers(ssd, 8, currentLocale),
  };
  const toCard = (item: typeof wallpaper | null) => item ? {
    Ssd: item.Ssd, FullDateString: item.FullDateString,
    ImageContent: { Title: item.ImageContent?.Title, Image: { Url: toAbsoluteUrl(item.ImageContent?.Image?.Url) } },
  } : null;
  const navigation = {
    previous: toCard(initialNavigation.previous), next: toCard(initialNavigation.next),
    related: initialNavigation.related.map((item) => toCard(item)!),
  };
  const languagePaths = Object.fromEntries(locales.map((option) => {
    const target = getWallpaperBySsd(ssd, option);
    return [option, localizePath(option, target ? `/wallpaper/${target.Ssd}` : "")];
  })) as Record<Locale, string>;
  const taxonomy = getImageTaxonomy(wallpaper);
  const title = wallpaper.ImageContent?.Title ?? wallpaper.Ssd;
  const description =
    wallpaper.ImageContent?.Description ?? dictionary.noDescription;
  const descriptionParagraphs = splitDescriptionIntoParagraphs(description);
  const translation = wallpaper.Translation;
  const translationNotice = translation?.generatedBy === "AI"
    ? translation.reviewedByHuman === false
      ? dictionary.aiTranslationUnreviewedNotice
      : dictionary.aiTranslationNotice
    : undefined;
  const backstagePath = wallpaper.ImageContent?.BackstageUrl;
  const backstageUrl = backstagePath?.startsWith("/search?")
    ? `https://www.bing.com${backstagePath}`
    : undefined;
  const formattedDate = formatArchiveDate(
    currentLocale,
    wallpaper.Ssd,
    wallpaper.FullDateString
  );
  const previewUrl = toAbsoluteUrl(wallpaper.ImageContent?.Image?.Url);
  const imageUrl = toAbsoluteUrl(wallpaper.ImageContent?.Image?.Wallpaper);
  const downloadUrl = imageUrl || previewUrl;
  const imageActions = downloadUrl || previewUrl ? (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
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
          className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition theme-button-hover"
        >
          {dictionary.detailOpenPreview}
        </a>
      ) : null}
    </div>
  ) : null;
  return (
    <DetailBrowseProvider key={`${currentLocale}:${ssd}`} locale={currentLocale} ssd={ssd}
      initialNavigation={navigation} indexUrl={detailIndexManifest[currentLocale]}>
    <DetailAmbientBackground imageUrl={previewUrl || imageUrl}>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        url: siteUrl(localizePath(currentLocale, `/wallpaper/${ssd}`)),
        description,
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: dictionary.siteTitle, item: siteUrl(localizePath(currentLocale)) },
            { "@type": "ListItem", position: 2, name: title, item: siteUrl(localizePath(currentLocale, `/wallpaper/${ssd}`)) },
          ],
        },
        ...((imageUrl || previewUrl) ? { mainEntity: {
          "@type": "ImageObject", name: title, description,
          contentUrl: imageUrl || previewUrl,
          thumbnailUrl: previewUrl || imageUrl,
          copyrightNotice: wallpaper.ImageContent?.Copyright,
        } } : {}),
      }} />
      <main className="theme-detail-page px-4 pb-10 pt-5 text-stone-100 sm:px-6 sm:pt-10 lg:px-8">
        <ScrollToTopButton label={dictionary.backToTop} />
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-10">
          <section className="flex flex-col gap-4 sm:-mb-2 sm:gap-6">
            <DetailBrowseHeader languagePaths={languagePaths} />

          <div className="flex flex-col gap-3">
              <div className="w-full min-w-0">
              <p className="theme-eyebrow text-sm uppercase tracking-[0.3em]">
                {dictionary.detailLabel}
              </p>
              <h1 className="mt-3 w-full break-words text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                {title}
              </h1>
            </div>
          </div>
          </section>

          <section className="theme-detail-panel overflow-hidden rounded-3xl sm:rounded-[2rem] shadow-[0_30px_90px_rgba(0,0,0,0.3)] backdrop-blur-md">
          <div className="bg-stone-900/58">
            {previewUrl ? (
              <Image
                referrerPolicy="no-referrer"
                src={previewUrl}
                alt={title}
                width={1920}
                height={1080}
                priority
                className="block h-auto w-full object-contain"
              />
            ) : (
              <div className="flex min-h-[24rem] items-center justify-center text-stone-400">
                {dictionary.noPreviewImage}
              </div>
            )}
          </div>

            {imageActions ? <div className="px-5 pt-5 sm:px-6 lg:hidden">{imageActions}</div> : null}

            {taxonomy ? <DetailTaxonomy category={taxonomy.category} tags={taxonomy.tags} countries={taxonomy.countries} locale={currentLocale} /> : null}

            <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-8">
            <div className="min-w-0 w-full">
              <h2 className="sr-only">{dictionary.detailDescription}</h2>
              <div className="detail-description-prose w-full space-y-4 break-words">
                {descriptionParagraphs.map((paragraph, index) => (
                  <p
                    key={`${wallpaper.Ssd}-description-${index}`}
                    className="sm:text-pretty"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              <TranslationNotice
                translation={translation}
                source={getTranslationSource(wallpaper)}
                dictionary={dictionary}
                notice={translationNotice}
                className="mt-3"
              />
              {backstageUrl ? (
                <a
                  href={backstageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-xs text-stone-500 underline-offset-4 hover:underline focus-visible:underline"
                >
                  <Image
                    src="/images/bing-icon.png"
                    alt=""
                    width={14}
                    height={14}
                    unoptimized
                    className="shrink-0"
                  />
                  {dictionary.detailLearnMoreOnBing}
                </a>
              ) : null}
            </div>

              <aside className="theme-detail-aside min-w-0 w-full break-words rounded-[1.5rem] backdrop-blur-sm p-5 lg:sticky lg:top-6 lg:self-start">
                <div className="hidden lg:block">{imageActions}</div>

                <dl className="mt-3 flex flex-col text-sm">
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-[max-content_minmax(0,1fr)] sm:items-baseline sm:gap-4 py-3">
                    <dt className="whitespace-nowrap text-xs text-stone-500">
                      {dictionary.detailCopyright}
                    </dt>
                    <dd className="min-w-0 break-words text-left sm:text-right leading-6 text-stone-200">
                    {wallpaper.ImageContent?.Copyright ?? dictionary.unknownCopyright}
                  </dd>
                </div>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-[max-content_minmax(0,1fr)] sm:items-baseline sm:gap-4 py-3">
                    <dt className="whitespace-nowrap text-xs text-stone-500">
                      {dictionary.detailDate}
                    </dt>
                    <dd className="min-w-0 break-words text-left sm:text-right tabular-nums leading-6 text-stone-200">
                    {formattedDate}
                  </dd>
                </div>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-[max-content_minmax(0,1fr)] sm:items-baseline sm:gap-4 py-3">
                    <dt className="whitespace-nowrap text-xs text-stone-500">
                      {dictionary.detailArchiveId}
                    </dt>
                    <dd className="min-w-0 break-words text-left sm:text-right font-mono leading-6 text-stone-300">
                      {wallpaper.Ssd}
                    </dd>
                  </div>
              </dl>
              </aside>
            </div>
          </section>

        <DetailBrowseNavigation />
        </div>
      </main>
    </DetailAmbientBackground>
    </DetailBrowseProvider>
  );
}
