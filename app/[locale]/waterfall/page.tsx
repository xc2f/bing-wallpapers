import { permanentRedirect } from "next/navigation";
import { isValidLocale, localizePath } from "@/lib/i18n";
import { legacyWaterfallQuery } from "@/lib/wallpaper-filters";

export default async function LegacyWaterfallPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const search = (await searchParams) ?? {};
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) query.set(key, first);
  }
  permanentRedirect(localizePath(locale, legacyWaterfallQuery(query)));
}
