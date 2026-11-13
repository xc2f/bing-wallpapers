import { getFilteredWallpapers, getWallpaperBySsd } from "@/lib/archive";
import { earthPageCopy, getEarthAlbums } from "@/lib/earth-albums";
import { formatArchiveDate, getDictionary, htmlLangMap, isValidLocale, localizePath, type Locale } from "@/lib/i18n";
import { acceptsMarkdown } from "@/lib/markdown-negotiation";
import { siteUrl } from "@/lib/seo";
import { cleanText, wallpaperDocument } from "@/lib/wallpaper-document";
import { wallpaperFilterKeys, wallpaperFilterParams } from "@/lib/wallpaper-filters";
import { waterfallPageWindow } from "@/lib/waterfall-pagination";

function escapeMarkdown(value: string) {
  return cleanText(value).replace(/[\\`*_{}\[\]<>#~&]/g, "\\$&");
}

function markdownLink(label: string, url: string) {
  return `[${escapeMarkdown(label)}](<${url}>)`;
}

function galleryMarkdown(locale: Locale, search: URLSearchParams) {
  const dictionary = getDictionary(locale);
  const filters = Object.fromEntries(wallpaperFilterKeys.map((key) => [key, search.get(key)?.trim()]));
  const wallpapers = getFilteredWallpapers(locale, filters);
  const { page, totalPages, start, end } = waterfallPageWindow(wallpapers.length, Number.parseInt(search.get("page") ?? "1", 10));
  const items = wallpapers.slice(start, end).map((item) => {
    const title = item.ImageContent?.Title || dictionary.untitled;
    const date = formatArchiveDate(locale, item.Ssd, item.FullDateString);
    return `- ${markdownLink(title, siteUrl(localizePath(locale, `/wallpaper/${item.Ssd}`)))} — ${escapeMarkdown(date)}`;
  });
  const pageLink = (label: string, target: number) => {
    const params = wallpaperFilterParams(filters);
    if (target > 1) params.set("page", String(target));
    return markdownLink(label, siteUrl(localizePath(locale, params.size ? `?${params}` : "")));
  };
  return [
    `# ${escapeMarkdown(dictionary.siteTitle)}`,
    escapeMarkdown(dictionary.siteDescription),
    items.length ? items.join("\n") : escapeMarkdown(dictionary.emptyTitle),
    [
      page > 1 && pageLink(dictionary.paginationPrev, page - 1),
      page < totalPages && pageLink(dictionary.paginationNext, page + 1),
    ].filter(Boolean).join(" · "),
  ].filter(Boolean).join("\n\n");
}

function earthMarkdown(locale: Locale) {
  const { title, description } = earthPageCopy(locale);
  const { albums, spaceAlbums } = getEarthAlbums(locale);
  const links = [...albums, ...spaceAlbums].map(({ label, href, count }) =>
    `- ${markdownLink(label, siteUrl(href))} (${count})`);
  return [`# ${title}`, description, links.join("\n")].filter(Boolean).join("\n\n");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string; page?: string[] }> },
) {
  const { locale, page = [] } = await params;
  if (!isValidLocale(locale)) return new Response(null, { status: 404 });
  const headers = {
    "Content-Type": "text/markdown; charset=utf-8",
    "Content-Language": htmlLangMap[locale],
    "Vary": "Accept, Accept-Language, Cookie, RSC",
    // Use the same cache key policy even on CDNs that ignore Vary: Accept.
    "Cache-Control": "private, no-store",
  };
  if (!acceptsMarkdown(request.headers.get("accept"))) return new Response(null, { status: 404, headers });

  const dictionary = getDictionary(locale);
  let body: string;
  if (page.length === 0) {
    body = galleryMarkdown(locale, new URL(request.url).searchParams);
  } else if (page.length === 1 && page[0] === "earth") {
    body = earthMarkdown(locale);
  } else if (page.length === 2 && page[0] === "wallpaper") {
    const item = getWallpaperBySsd(page[1], locale);
    if (!item) return new Response(`# ${dictionary.metadataNotFound}\n`, { status: 404, headers });
    if (item.Ssd !== page[1]) {
      return new Response(null, {
        status: 308,
        headers: { ...headers, Location: localizePath(locale, `/wallpaper/${item.Ssd}`) },
      });
    }
    const { title, description, copyright, date, source, image, translationNotice } = wallpaperDocument(item, locale);
    const facts = [
      date && `- ${dictionary.detailDate}: ${escapeMarkdown(date)}`,
      copyright && `- ${dictionary.detailCopyright}: ${escapeMarkdown(copyright)}`,
      `- ${markdownLink(dictionary.detailLabel, source)}`,
      image && `- ${markdownLink(dictionary.detailOpenFull, image)}`,
    ].filter(Boolean).join("\n");
    body = [`# ${escapeMarkdown(title)}`, escapeMarkdown(description), escapeMarkdown(translationNotice), facts].filter(Boolean).join("\n\n");
  } else {
    return new Response(null, { status: 404, headers });
  }

  return new Response(`${body}\n`, { headers });
}
