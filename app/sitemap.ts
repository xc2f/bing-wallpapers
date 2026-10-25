import type { MetadataRoute } from "next";
import { getAllWallpapers, paginateWallpapers, toAbsoluteUrl } from "@/lib/archive";
import { locales, localizePath } from "@/lib/i18n";
import { languageAlternates, siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const wallpapers = getAllWallpapers();
  const { totalPages } = paginateWallpapers(wallpapers, 1);
  const paths = [
    "", "/waterfall",
    ...Array.from({ length: totalPages - 1 }, (_, index) => `?page=${index + 2}`),
  ];

  return locales.flatMap((locale) => [
    ...paths.map((path) => ({
      url: siteUrl(localizePath(locale, path)),
      alternates: { languages: languageAlternates(path) },
    })),
    ...wallpapers.map((wallpaper) => {
      const path = `/wallpaper/${wallpaper.Ssd}`;
      const image = toAbsoluteUrl(wallpaper.ImageContent?.Image?.Url);
      return {
        url: siteUrl(localizePath(locale, path)),
        alternates: { languages: languageAlternates(path) },
        ...(image ? { images: [image] } : {}),
      };
    }),
  ]);
}
