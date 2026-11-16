import { getAllWallpapers } from "@/lib/archive";
import { htmlLangMap, isValidLocale } from "@/lib/i18n";
import { getTaxonomyCounts } from "@/lib/image-taxonomy";
import { taxonomyLabel } from "@/lib/taxonomy-labels";

export function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get("locale")?.trim() ?? "";
  if (!isValidLocale(locale)) return Response.json({ error: "Invalid locale." }, { status: 400 });

  const wallpapers = getAllWallpapers(locale);
  const options = (field: "category" | "tags" | "countries", kind: "category" | "tag" | "country") =>
    getTaxonomyCounts(wallpapers, field).map(([id, count]) => ({ id, name: taxonomyLabel(id, locale, kind), count }));

  return Response.json({
    locale,
    categories: options("category", "category"),
    tags: options("tags", "tag"),
    countries: options("countries", "country"),
  }, {
    headers: {
      "Content-Language": htmlLangMap[locale],
      "Cache-Control": "public, max-age=3600",
    },
  });
}
