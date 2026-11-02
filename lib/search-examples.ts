import { searchWallpapers, type WallpaperItem } from "@/lib/archive";
import { getDictionary, type Locale } from "@/lib/i18n";

export interface SearchExample {
  query: string;
  description: string;
}

export function getSearchExamples(wallpapers: WallpaperItem[], locale: Locale): SearchExample[] {
  if (!wallpapers.length) return [];
  const dictionary = getDictionary(locale);
  const english = getDictionary("en");
  const first = wallpapers[0];
  // A title fragment without query operators is safe to use in every example.
  const term = first.ImageContent?.Title?.normalize("NFKC").match(/[\p{L}\p{N}]+(?:[ ’'][\p{L}\p{N}]+)*/u)?.[0];
  const phrase = term || first.Ssd;
  const other = wallpapers.find((item) => item.Ssd !== first.Ssd)?.Ssd ?? "00000000";
  const definitions = [
    { query: "filterHelpQueryPhrase", description: "filterHelpExamplePhrase", fallback: phrase },
    { query: "filterHelpQueryOr", description: "filterHelpExampleOr", fallback: `${phrase}, ${other}` },
    { query: "filterHelpQueryExclude", description: "filterHelpExampleExclude", fallback: `${phrase} -${other}` },
    { query: "filterHelpQueryFields", description: "filterHelpExampleFields", fallback: term ? `title:"${term}"` : `ssd:${first.Ssd}` },
  ] as const;

  return definitions.map(({ query, description, fallback }) => ({
    query: [dictionary[query], english[query], fallback].find((candidate) =>
      searchWallpapers(wallpapers, candidate).length > 0
    )!,
    description: dictionary[description],
  }));
}
