import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import NotFoundContent from "@/components/not-found-content";
import SiteDocument from "@/components/site-document";
import { detectLocaleFromAcceptLanguage, isValidLocale, localeCookieName } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 | Bing Wallpapers Archive",
  robots: { index: false, follow: true },
};

export default async function GlobalNotFound() {
  const savedLocale = (await cookies()).get(localeCookieName)?.value;
  const locale = savedLocale && isValidLocale(savedLocale)
    ? savedLocale
    : detectLocaleFromAcceptLanguage((await headers()).get("accept-language"));

  return (
    <SiteDocument locale={locale}>
      <NotFoundContent fallbackLocale={locale} />
    </SiteDocument>
  );
}
