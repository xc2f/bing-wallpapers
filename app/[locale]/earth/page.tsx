import { preload } from "react-dom";
import { EARTH_PREVIEW_TEXTURE } from "@/lib/earth-surface";
import { headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { earthInitialView } from "@/lib/earth-initial-view";
import type { Metadata } from "next";
import EarthGallery from "@/components/earth-gallery";
import { isValidLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { earthPageCopy, getEarthAlbums } from "@/lib/earth-albums";

// The initial orientation is specific to the visitor, never a shared cached page.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return pageMetadata({ locale, path: "/earth", ...earthPageCopy(locale) });
}

export default async function EarthPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  preload(EARTH_PREVIEW_TEXTURE, { as: "image", fetchPriority: "high", crossOrigin: "anonymous" });
  const requestHeaders = await headers();
  let visitorCountry = requestHeaders.get("cf-ipcountry");
  try {
    const country = visitorCountry ?? getCloudflareContext().cf?.country;
    if (typeof country === "string") visitorCountry = country;
  } catch {
    // Non-Cloudflare development/hosting uses the header or the default view.
  }
  const initialView = earthInitialView(visitorCountry);
  const { albums, spaceAlbums } = getEarthAlbums(locale);
  return <EarthGallery albums={albums} spaceAlbums={spaceAlbums} locale={locale} initialView={initialView} />;
}
