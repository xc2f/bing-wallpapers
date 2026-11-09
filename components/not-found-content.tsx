"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { defaultLocale, getDictionary, htmlLangMap, isValidLocale, localizePath, type Locale } from "@/lib/i18n";

export default function NotFoundContent({ fallbackLocale = defaultLocale }: { fallbackLocale?: Locale }) {
  const pathname = usePathname();
  const segment = pathname?.split("/")[1] ?? "";
  const locale = isValidLocale(segment) ? segment : fallbackLocale;
  const dictionary = getDictionary(locale);

  return (
    <main lang={htmlLangMap[locale]} className="not-found-page flex min-h-[75svh] items-center justify-center px-6 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-xl text-center">
        <Link href={localizePath(locale)} className="theme-eyebrow rounded text-[11px] uppercase tracking-[0.22em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300">
          {dictionary.archiveLabel}
        </Link>
        <div aria-hidden="true" className="not-found-art relative mx-auto my-8 w-64 sm:my-10 sm:w-80">
          <span data-display-text="true" className="block text-[8rem] leading-none tracking-[-0.06em] sm:text-[10rem]">404</span>
          <svg viewBox="0 0 320 64" fill="none" className="absolute inset-x-0 bottom-0 w-full">
            <path d="m4 58 60-40 35 23 43-35 69 48 36-25 69 29" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m101 58 41-31 44 31M29 63h262" stroke="currentColor" strokeOpacity=".35" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-medium tracking-tight text-stone-100 sm:text-3xl">{dictionary.notFoundTitle}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-stone-400">{dictionary.notFoundDescription}</p>
        <Link href={localizePath(locale)} className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-sm font-medium transition hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300">
          <span aria-hidden="true">←</span>
          {dictionary.notFoundBrowse}
        </Link>
      </div>
    </main>
  );
}
