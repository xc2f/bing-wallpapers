import detailIndexManifest from "@/db/detail-index-manifest.json";
import { DetailBrowseProvider } from "@/components/detail-browse-context";
import DetailBrowseHeader from "@/components/detail-browse-header";
import DetailBrowseNavigation from "@/components/detail-browse-navigation";
import { getImageTaxonomy } from "@/lib/image-taxonomy";
import DetailLocationMap from "@/components/detail-location-map";
import DetailTaxonomy from "@/components/detail-taxonomy";
import { getBingHeadline } from "@/lib/bing-headline";
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

function splitDescriptionIntoParagraphs(description: string, locale: Locale) {
  const normalized = description.trim();

  if (!normalized) {
    return [];
  }

  if (locale === "zh" || locale === "ja") {
    const separator = normalized.includes("\n")
      ? /\r?\n/
      : /(?<=[。！？][”’」』）】]*)(?![。！？…”’」』）】])/;
    return normalized.split(separator).map((part) => part.trim()).filter(Boolean);
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
  const descriptionParagraphs = splitDescriptionIntoParagraphs(description, currentLocale);
  const headline = getBingHeadline(wallpaper.ImageContent?.Headline);
  const quickFact = wallpaper.ImageContent?.QuickFact?.MainText?.trim();
  const quickFactTranslation = wallpaper.FieldTranslations?.["QuickFact.MainText"];
  const translation = wallpaper.Translation;
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
  const imageHeadline = previewUrl && headline !== title ? headline : undefined;
  const learnMoreLink = backstageUrl ? (
    <a
      href={backstageUrl}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1.5 text-xs underline-offset-4 hover:underline focus-visible:underline ${previewUrl ? "detail-image-spot-link ml-auto max-w-full py-1" : "mt-5 text-stone-500"}`}
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
  ) : null;
  const imageActions = downloadUrl || previewUrl ? (
    <div className={previewUrl ? "grid grid-cols-2 gap-2.5 lg:flex lg:flex-wrap lg:items-center lg:gap-x-3 lg:gap-y-1" : "grid lg:flex"}>
      {downloadUrl ? (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 min-w-0 items-center justify-center break-words rounded-full bg-amber-300 px-2 py-2 text-center text-sm font-medium text-stone-950 transition hover:bg-amber-200 lg:px-4"
        >
          {dictionary.detailOpenFull}
        </a>
      ) : null}
      {previewUrl ? (
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 min-w-0 items-center justify-center break-words rounded-full px-2 py-2 text-center text-sm font-medium max-lg:border max-lg:border-[rgb(var(--theme-border-rgb)/0.15)] max-lg:text-[rgb(var(--theme-text-strong-rgb))] max-lg:hover:bg-[rgb(var(--theme-overlay-rgb)/var(--theme-button-hover-opacity))] lg:px-1 lg:text-[rgb(var(--theme-accent-text-rgb))] lg:underline-offset-4 lg:hover:underline lg:focus-visible:underline"
        >
          {dictionary.detailOpenPreview}
        </a>
      ) : null}
    </div>
  ) : null;
  return (
    <DetailBrowseProvider key={`${currentLocale}:${ssd}`} locale={currentLocale} ssd={ssd}
      initialNavigation={navigation} indexUrls={detailIndexManifest[currentLocale]}>
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
          <div className="relative bg-stone-900/58">
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
            {previewUrl && (imageHeadline || learnMoreLink) ? (
              <div className="detail-image-spot absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-4 gap-y-1 break-words px-5 pb-3 pt-7 sm:px-6 sm:pb-4 sm:pt-10 lg:px-8">
                {imageHeadline ? <p className="min-w-0 max-w-full text-xs font-medium leading-snug sm:text-sm">{imageHeadline}</p> : null}
                {learnMoreLink}
              </div>
            ) : null}
          </div>

            {imageActions ? <div className="px-5 pt-5 sm:px-6 lg:hidden">{imageActions}</div> : null}

            {taxonomy ? <DetailTaxonomy category={taxonomy.category} tags={taxonomy.tags} countries={taxonomy.countries} locale={currentLocale} /> : null}

            <div className="grid grid-cols-1 gap-5 p-5 sm:gap-6 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-x-8 lg:px-8 lg:pb-8">
            <div className="min-w-0 w-full">
              <h2 className="sr-only">{dictionary.detailDescription}</h2>
              <div className="detail-description-prose w-full space-y-2 break-words sm:space-y-2.5">
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
                className="mt-3"
              />
              {quickFact ? (
                <div className="detail-quick-fact mt-4 rounded-e-lg px-3 py-2.5">
                  <div className="sm:flex sm:items-baseline sm:gap-3">
                    <h2 className="shrink-0 text-xs font-semibold">{dictionary.detailQuickFact}</h2>
                    <p className="mt-1 min-w-0 whitespace-pre-line break-words text-sm leading-relaxed text-stone-200 sm:mt-0">
                      {quickFact}
                    </p>
                  </div>
                  <TranslationNotice
                    field="QuickFact.MainText"
                    translation={quickFactTranslation}
                    source={getTranslationSource(wallpaper, "QuickFact.MainText")}
                    dictionary={dictionary}
                    className="mt-1.5"
                  />
                </div>
              ) : null}
              {!previewUrl ? learnMoreLink : null}
            </div>

              <aside className="theme-detail-aside min-w-0 w-full break-words rounded-2xl px-4 py-3 lg:self-start lg:p-4">
                {imageActions ? <div className="mb-3 hidden lg:block">{imageActions}</div> : null}

                <dl className="detail-archive-meta text-sm">
                  <div>
                    <dt className="text-xs text-stone-400">
                      {dictionary.detailCopyright}
                    </dt>
                    <dd className="min-w-0 break-words text-right text-stone-200">
                      {wallpaper.ImageContent?.Copyright ?? dictionary.unknownCopyright}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-400">
                      {dictionary.detailDate}
                    </dt>
                    <dd className="min-w-0 break-words text-right tabular-nums text-stone-200">
                      {formattedDate}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-400">
                      {dictionary.detailArchiveId}
                    </dt>
                    <dd className="min-w-0 break-words text-right font-mono text-stone-300">
                      {wallpaper.Ssd}
                    </dd>
                  </div>
                </dl>
              </aside>
              <DetailLocationMap wallpaper={wallpaper} countries={taxonomy?.countries} locale={currentLocale} />
            </div>
          </section>

        <DetailBrowseNavigation />
        </div>
      </main>
    </DetailAmbientBackground>
    </DetailBrowseProvider>
  );
}
