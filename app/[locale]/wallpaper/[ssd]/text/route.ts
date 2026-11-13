import { getWallpaperBySsd } from "@/lib/archive";
import { htmlLangMap, isValidLocale, localizePath } from "@/lib/i18n";
import { wallpaperDocument } from "@/lib/wallpaper-document";

const contentType = "text/plain; charset=utf-8";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; ssd: string }> },
) {
  const { locale, ssd } = await params;
  if (!isValidLocale(locale)) {
    return new Response("Wallpaper not found.\n", {
      status: 404,
      headers: { "Content-Type": contentType },
    });
  }

  const wallpaper = getWallpaperBySsd(ssd, locale);
  if (!wallpaper) {
    return new Response("Wallpaper not found.\n", {
      status: 404,
      headers: { "Content-Type": contentType },
    });
  }

  const detailPath = localizePath(locale, `/wallpaper/${wallpaper.Ssd}`);
  if (wallpaper.Ssd !== ssd) {
    return new Response(null, { status: 308, headers: { Location: `${detailPath}/text` } });
  }

  const { title, description, copyright, date, source, image, translationNotice } = wallpaperDocument(wallpaper, locale);
  const facts = [
    date && `Archive date: ${date}`,
    copyright && `Copyright: ${copyright}`,
    `Source page: ${source}`,
    image && `Image: ${image}`,
  ].filter(Boolean).join("\n");
  const body = [title, description, translationNotice, facts].filter(Boolean).join("\n\n");

  return new Response(`${body}\n`, {
    headers: {
      "Content-Type": contentType,
      "Content-Language": htmlLangMap[locale],
      "Cache-Control": "public, max-age=3600",
    },
  });
}
