"use client";
import Image from "next/image";
import Link from "next/link";
import DetailRelatedStrip from "@/components/detail-related-strip";
import DetailKeyboardNavigation from "@/components/detail-keyboard-navigation";
import { resizeBingImage } from "@/lib/bing-image";
import { formatArchiveDate } from "@/lib/i18n";
import { useDetailBrowse } from "@/components/detail-browse-context";
// Index and initial navigation image URLs are already absolute.
const toAbsoluteUrl = (url?: string) => url ?? "";
export default function DetailBrowseNavigation() {
  const { currentLocale, dictionary, navigation: { previous, next, related: relatedWallpapers }, createDetailHref } = useDetailBrowse();
  const moreWallpapers = relatedWallpapers.filter((item) => item.Ssd !== previous?.Ssd && item.Ssd !== next?.Ssd);
  return <>
    <DetailKeyboardNavigation leftHref={next ? createDetailHref(next.Ssd) : undefined}
      rightHref={previous ? createDetailHref(previous.Ssd) : undefined} />
        {previous || next ? (
          <section className="grid gap-4 section-divider pt-8 md:grid-cols-2">
            {next ? (
            <Link
              prefetch={false}
              href={createDetailHref(next.Ssd)}
              replace
              className="theme-detail-nav-card group overflow-hidden rounded-3xl bg-white/5 transition duration-300 hover:-translate-x-1 hover:bg-white/10"
            >
              <div className="grid min-h-[10rem] gap-0 grid-cols-[96px_minmax(0,1fr)] sm:grid-cols-[132px_minmax(0,1fr)]">
                <div className="relative h-full min-h-[10rem] overflow-hidden bg-stone-900">
                  {toAbsoluteUrl(next.ImageContent?.Image?.Url) ? (
                    <Image
                      referrerPolicy="no-referrer"
                      src={resizeBingImage(toAbsoluteUrl(next.ImageContent?.Image?.Url), 320, 180)}
                      alt={next.ImageContent?.Title ?? next.Ssd}
                      width={1920}
                      height={1080}
                      sizes="132px"
                      quality={62}
                      className="block h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-col justify-between p-4 sm:p-5">
                  <div>
                    <p className="text-xs font-medium text-stone-400">
                      ← {dictionary.detailNewerShort}
                    </p>
                    <p className="mt-2 text-xs tabular-nums text-stone-400">
                      {formatArchiveDate(currentLocale, next.Ssd, next.FullDateString)}
                    </p>
                    <h3 className="mt-1 min-w-0 line-clamp-2 text-lg font-medium leading-6 text-white">
                      {next.ImageContent?.Title ?? next.Ssd}
                    </h3>
                  </div>
                </div>
              </div>
            </Link>
            ) : <div aria-hidden="true" className="hidden md:block" />}

            {previous ? (
            <Link
              prefetch={false}
              href={createDetailHref(previous.Ssd)}
              replace
              className="theme-detail-nav-card group overflow-hidden rounded-3xl bg-white/5 transition duration-300 hover:translate-x-1 hover:bg-white/10"
            >
              <div className="grid min-h-[10rem] gap-0 grid-cols-[minmax(0,1fr)_96px] sm:grid-cols-[minmax(0,1fr)_132px]">
                <div className="flex min-w-0 flex-col justify-between p-4 sm:p-5 text-right">
                  <div>
                    <p className="text-xs font-medium text-stone-400">
                      {dictionary.detailOlderShort} →
                    </p>
                    <p className="mt-2 text-xs tabular-nums text-stone-400">
                      {formatArchiveDate(currentLocale, previous.Ssd, previous.FullDateString)}
                    </p>
                    <h3 className="mt-1 min-w-0 line-clamp-2 text-lg font-medium leading-6 text-white">
                      {previous.ImageContent?.Title ?? previous.Ssd}
                    </h3>
                  </div>
                </div>
                <div className="relative h-full min-h-[10rem] overflow-hidden bg-stone-900">
                  {toAbsoluteUrl(previous.ImageContent?.Image?.Url) ? (
                    <Image
                      referrerPolicy="no-referrer"
                      src={resizeBingImage(toAbsoluteUrl(previous.ImageContent?.Image?.Url), 320, 180)}
                      alt={previous.ImageContent?.Title ?? previous.Ssd}
                      width={1920}
                      height={1080}
                      sizes="132px"
                      quality={62}
                      className="block h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
              </div>
            </Link>
            ) : <div aria-hidden="true" className="hidden md:block" />}
          </section>
        ) : null}

        {moreWallpapers.length > 0 ? <section className="flex flex-col gap-4 section-divider pt-8">
          <h2 className="text-xl font-semibold text-white">{dictionary.detailMore}</h2>

          <DetailRelatedStrip>
            {moreWallpapers.map((item) => {
              const relatedTitle = item.ImageContent?.Title ?? item.Ssd;
              const relatedPreviewUrl = toAbsoluteUrl(item.ImageContent?.Image?.Url);

              return (
                <Link
                  prefetch={false}
                  key={item.Ssd}
                  href={createDetailHref(item.Ssd)}
                  replace
                  className="theme-detail-related-card group flex w-[min(76vw,18rem)] shrink-0 snap-start flex-col overflow-hidden rounded-[1.375rem] bg-white/[0.03] transition duration-300 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-300"
                >
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-stone-900">
                    {relatedPreviewUrl ? (
                      <Image
                        referrerPolicy="no-referrer"
                        src={resizeBingImage(relatedPreviewUrl, 640, 360)}
                        alt=""
                        width={1920}
                        height={1080}
                        sizes="(max-width: 378px) 76vw, 288px"
                        quality={62}
                        className="block h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-stone-400">
                        {dictionary.noPreviewImage}
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                    <h3 className="min-w-0 line-clamp-2 min-h-[2.75rem] text-base font-medium leading-snug text-white">
                      {relatedTitle}
                    </h3>
                    <p className="mt-auto text-xs tabular-nums text-stone-500">
                      {formatArchiveDate(currentLocale, item.Ssd, item.FullDateString)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </DetailRelatedStrip>
        </section> : null}
  </>;
}
