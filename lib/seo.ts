import type { Metadata } from "next";
import { defaultLocale, getDictionary, htmlLangMap, locales, localizePath, type Locale } from "@/lib/i18n";

// BASE_URL belongs to the Bing image host; the public site has its own origin.
export const SITE_URL = new URL(process.env.SITE_URL || "https://bing.xc2f.com").origin;

export function siteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function languageAlternates(path = "") {
  return Object.fromEntries([
    ...locales.map((locale) => [htmlLangMap[locale], siteUrl(localizePath(locale, path))]),
    ["x-default", siteUrl(localizePath(defaultLocale, path))],
  ]);
}

const ogLocales: Record<Locale, string> = {
  en: "en_US", zh: "zh_CN", es: "es_ES", fr: "fr_FR", de: "de_DE", ja: "ja_JP", ko: "ko_KR",
};

export function pageMetadata({ locale, path = "", title, description, image, noIndex = false }: {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  image?: { url: string; alt: string };
  noIndex?: boolean;
}): Metadata {
  const url = siteUrl(localizePath(locale, path));
  const summary = description.replace(/\s+/g, " ").trim().slice(0, 160);
  const images = [image ?? { url: siteUrl("/images/bing-xc2f.webp"), alt: getDictionary(locale).siteTitle }];

  return {
    title,
    description: summary,
    alternates: { canonical: url, languages: languageAlternates(path) },
    robots: {
      index: !noIndex,
      follow: true,
      googleBot: { index: !noIndex, follow: true, "max-image-preview": "large" },
    },
    openGraph: {
      type: "website", url, title, description: summary,
      siteName: getDictionary(locale).siteTitle,
      locale: ogLocales[locale],
      alternateLocale: locales.filter((item) => item !== locale).map((item) => ogLocales[item]),
      images,
    },
    twitter: { card: "summary_large_image", title, description: summary, images },
  };
}

export function pageTitle(locale: Locale, title: string, page: number) {
  const labels: Record<Locale, string> = {
    en: `Page ${page}`, zh: `第 ${page} 页`, es: `Página ${page}`,
    fr: `Page ${page}`, de: `Seite ${page}`, ja: `${page} ページ`, ko: `${page} 페이지`,
  };
  return page > 1 ? `${title} | ${labels[locale]}` : title;
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
