import { hasWallpaperSearchMatch, type WallpaperItem } from "@/lib/archive";
import { getDictionary, type Locale } from "@/lib/i18n";
import { taxonomyUiLabel } from "@/lib/taxonomy-ui-labels";

export interface SearchExample {
  query: string;
  description: string;
  isFieldSearch: boolean;
  isCombinedSearch?: boolean;
}

const examplesByList = new WeakMap<WallpaperItem[], Map<Locale, SearchExample[]>>();

export function getSearchExamples(wallpapers: WallpaperItem[], locale: Locale): SearchExample[] {
  if (!wallpapers.length) return [];
  const cached = examplesByList.get(wallpapers)?.get(locale);
  if (cached) return cached;
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

  const examples: SearchExample[] = definitions.map(({ query, description, fallback }) => ({
    query: [dictionary[query], english[query], fallback].find((candidate) =>
      hasWallpaperSearchMatch(wallpapers, candidate)
    )!,
    description: dictionary[description],
    isFieldSearch: query === "filterHelpQueryFields",
  }));

  const dates = wallpapers.map((item) => item.Ssd.slice(0, 8)).filter((date) => /^\d{8}$/.test(date)).sort();
  if (dates.length) {
    const iso = (date: string) => `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
    const range = `date:${iso(dates[0])}..${iso(dates[dates.length - 1])}`;
    const field = term ? `title:"${term}"` : `ssd:${first.Ssd}`;
    examples.splice(3, 0,
      { query: range, description: taxonomyUiLabel("searchDateRange", locale), isFieldSearch: false },
    );
    examples.push(
      { query: `(${field} OR ssd:${other}) AND ${range}`, description: taxonomyUiLabel("searchCombined", locale), isFieldSearch: false, isCombinedSearch: true },
    );
  }
  let cache = examplesByList.get(wallpapers);
  if (!cache) {
    cache = new Map();
    examplesByList.set(wallpapers, cache);
  }
  cache.set(locale, examples);
  return examples;
}
