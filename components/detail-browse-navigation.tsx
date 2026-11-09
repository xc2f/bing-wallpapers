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
  return <>
    <DetailKeyboardNavigation previousHref={previous ? createDetailHref(previous.Ssd) : undefined}
      nextHref={next ? createDetailHref(next.Ssd) : undefined} />
        {previous || next ? (
          <section className="grid gap-4 border-t border-white/10 pt-8 md:grid-cols-2">
            {next ? (
            <Link
              prefetch={false}
              href={createDetailHref(next.Ssd)}
              replace
              className="theme-detail-nav-card group overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition duration-300 hover:-translate-x-1 hover:bg-white/10"
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
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      ← {dictionary.detailNewerShort}
                    </p>
                    <p className="mt-2 text-sm text-stone-400">
                      {formatArchiveDate(currentLocale, next.Ssd, next.FullDateString)}
                    </p>
                    <h3 className="mt-1 min-w-0 line-clamp-2 text-lg font-semibold text-white">
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
              className="theme-detail-nav-card group overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition duration-300 hover:translate-x-1 hover:bg-white/10"
            >
              <div className="grid min-h-[10rem] gap-0 grid-cols-[minmax(0,1fr)_96px] sm:grid-cols-[minmax(0,1fr)_132px]">
                <div className="flex min-w-0 flex-col justify-between p-4 sm:p-5 text-right">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      {dictionary.detailOlderShort} →
                    </p>
                    <p className="mt-2 text-sm text-stone-400">
                      {formatArchiveDate(currentLocale, previous.Ssd, previous.FullDateString)}
                    </p>
                    <h3 className="mt-1 min-w-0 line-clamp-2 text-lg font-semibold text-white">
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

        <section className="flex flex-col gap-4 border-t border-white/10 pt-8">
          <h2 className="text-2xl font-semibold text-white">{dictionary.detailMore}</h2>

          <DetailRelatedStrip>
            {relatedWallpapers.map((item, index) => {
              const relatedTitle = item.ImageContent?.Title ?? item.Ssd;
              const relatedPreviewUrl = toAbsoluteUrl(item.ImageContent?.Image?.Url);

              return (
                <Link
                  prefetch={false}
                  key={item.Ssd}
                  href={createDetailHref(item.Ssd)}
                  replace
                  className={`theme-detail-related-card group ${
                    index >= 4 ? "hidden md:flex" : "flex"
                  } w-[16.5rem] shrink-0 snap-start overflow-hidden rounded-[1.375rem] border border-white/10 bg-white/[0.03] transition duration-300 hover:border-white/15 hover:bg-white/[0.06]`}
                >
                  <div className="relative min-h-[6.5rem] w-[6.5rem] shrink-0 self-stretch overflow-hidden bg-stone-900">
                    {relatedPreviewUrl ? (
                      <Image
                        referrerPolicy="no-referrer"
                        src={resizeBingImage(relatedPreviewUrl, 320, 180)}
                        alt={relatedTitle}
                        width={1920}
                        height={1080}
                        sizes="104px"
                        quality={62}
                        className="block h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
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
                    <h3 className="min-w-0 line-clamp-2 text-[0.96rem] font-semibold leading-snug text-white">
                      {relatedTitle}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </DetailRelatedStrip>
        </section>
  </>;
}
