import { preload } from "react-dom";
import { EARTH_PREVIEW_TEXTURE } from "@/lib/earth-surface";
import { headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { earthInitialView } from "@/lib/earth-initial-view";
import type { Metadata } from "next";
import EarthGallery from "@/components/earth-gallery";
import { getAllWallpapers, toAbsoluteUrl } from "@/lib/archive";
import { getImageTaxonomy } from "@/lib/image-taxonomy";
import { isValidLocale, localizePath } from "@/lib/i18n";
import { taxonomyLabel } from "@/lib/taxonomy-labels";
import { pageMetadata } from "@/lib/seo";
import { getSpaceAlbumGroups } from "@/lib/space-albums";
import coordinates from "@/lib/country-coordinates.json";

// The initial orientation is specific to the visitor, never a shared cached page.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return pageMetadata({ locale, path: "/earth", title: locale === "zh" ? "地球图集" : "Wallpaper Earth", description: locale === "zh" ? "转动地球，探索各国家和地区的必应壁纸图集。" : "Explore wallpaper collections around the world." });
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
  const groups = new Map<string, { id: string; title: string; image: string; href: string }[]>();
  const wallpapers = getAllWallpapers(locale);
  const seen = new Set<string>();
  for (const item of wallpapers) {
    if (!item.imageId || seen.has(item.imageId)) continue;
    seen.add(item.imageId);
    for (const country of getImageTaxonomy(item)?.countries ?? []) {
      const images = groups.get(country) ?? [];
      images.push({ id: item.Ssd, title: item.ImageContent?.Title ?? "", image: toAbsoluteUrl(item.ImageContent?.Image?.Url), href: localizePath(locale, `/wallpaper/${item.Ssd}`) });
      groups.set(country, images);
    }
  }
  const albums = [...groups].map(([id, images]) => ({ id, label: taxonomyLabel(id, locale, "country"), coordinates: (coordinates as Record<string, number[]>)[id] ?? null, count: images.length, images: images.slice(0, 7), href: localizePath(locale, `?country=${id}`) })).sort((a, b) => b.count - a.count);
  const spaceAlbums = getSpaceAlbumGroups(wallpapers).map(group => ({
    id: `space-${group.id}`,
    label: taxonomyLabel(group.tag || "space", locale, group.tag ? "tag" : "category"),
    coordinates: null,
    count: group.items.length,
    images: group.items.slice(0, 7).map(item => ({ id: item.Ssd, title: item.ImageContent?.Title ?? "", image: toAbsoluteUrl(item.ImageContent?.Image?.Url), href: localizePath(locale, `/wallpaper/${item.Ssd}`) })),
    href: localizePath(locale, `?category=space${group.tag ? `&tag=${group.tag}` : ""}`),
  }));
  return <EarthGallery albums={albums} spaceAlbums={spaceAlbums} locale={locale} initialView={initialView} />;
}
