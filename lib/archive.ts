import { getImageTaxonomy } from "@/lib/image-taxonomy";
import data from "@/db/media_contents.json";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

export const BING_BASE_URL = process.env.BASE_URL || "https://www.bing.com";
export const PAGE_SIZE = 12;

export interface TranslationMetadata {
  generatedBy: string;
  reviewedByHuman?: boolean;
  sourceLocale?: Locale;
  sourceSsd?: string;
}

export interface WallpaperItem {
  imageId?: string;
  Translation?: TranslationMetadata;
  Ssd: string;
  FullDateString?: string;
  ImageContent?: {
    Title?: string;
    Description?: string;
    Copyright?: string;
    BackstageUrl?: string;
    Image?: {
      Url?: string;
      Wallpaper?: string;
      Downloadable?: boolean;
    };
  };
}

interface WallpaperArchive {
  schemaVersion: 2;
  defaultLocale: Locale;
  fallbackLocale: Locale;
  mediaContents: Record<Locale, WallpaperItem[]>;
}

const wallpaperArchive = data as WallpaperArchive;
function archiveDateKey(ssd: string) {
  return /^\d{8}(?:_|$)/.test(ssd) ? ssd.slice(0, 8) : ssd;
}

export function selectWallpaperRecords(items: WallpaperItem[]) {
  const byDate = new Map<string, WallpaperItem>();
  // Prefer the latest ID within one source, and official records over AI translations.
  const preferredOrder = [...items].sort((a, b) =>
    Number(b.Translation?.generatedBy === "AI") - Number(a.Translation?.generatedBy === "AI") ||
    a.Ssd.localeCompare(b.Ssd)
  );
  for (const item of preferredOrder) {
    byDate.set(archiveDateKey(item.Ssd), item);
  }
  return [...byDate.values()].sort((a, b) => b.Ssd.localeCompare(a.Ssd));
}

const wallpapersByLocale = new Map(locales.map((locale) => [
  locale,
  selectWallpaperRecords(wallpaperArchive.mediaContents[locale]),
] as const));
const knownArchiveIds = new Set(Object.values(wallpaperArchive.mediaContents).flat().map((item) => item.Ssd));
const wallpaperDates = new Map(locales.map((locale) => [
  locale,
  new Map(wallpapersByLocale.get(locale)!.map((item) => [archiveDateKey(item.Ssd), item])),
] as const));
const wallpaperIndexes = new Map(locales.map((locale) => [
  locale,
  new Map(wallpapersByLocale.get(locale)!.map((wallpaper) => [wallpaper.Ssd, wallpaper])),
] as const));

interface DateParts {
  year: string;
  month: string;
  day: string;
}

export function toAbsoluteUrl(path?: string) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${BING_BASE_URL}${path}`;
}

export function getAllWallpapers(locale: Locale = defaultLocale) {
  return wallpapersByLocale.get(locale)!;
}

export function getWallpaperBySsd(ssd: string, locale: Locale = defaultLocale) {
  return wallpaperIndexes.get(locale)!.get(ssd) ?? (knownArchiveIds.has(ssd)
    ? wallpaperDates.get(locale)!.get(archiveDateKey(ssd))
    : undefined);
}

export function getTranslationSource(wallpaper: WallpaperItem) {
  const translation = wallpaper.Translation;
  if (translation?.generatedBy !== "AI" || !translation.sourceLocale || !translation.sourceSsd) {
    return undefined;
  }
  return wallpaperArchive.mediaContents[translation.sourceLocale]?.find(
    (item) => item.Ssd === translation.sourceSsd
  );
}

export function getRelatedWallpapers(ssd: string, limit = 3, locale: Locale = defaultLocale) {
  return getRelatedWallpapersFromList(getAllWallpapers(locale), ssd, limit);
}

export function getRelatedWallpapersFromList(
  wallpapers: WallpaperItem[],
  ssd: string,
  limit = 3
) {
  const currentIndex = wallpapers.findIndex((wallpaper) => wallpaper.Ssd === ssd);

  if (currentIndex === -1) {
    return wallpapers.filter((wallpaper) => wallpaper.Ssd !== ssd).slice(0, limit);
  }

  const current = wallpapers[currentIndex];
  const taxonomy = getImageTaxonomy(current);
  const currentTags = new Set(taxonomy?.tags ?? []);
  const indexes = new Map(wallpapers.map((item, index) => [item, index]));
  const related = wallpapers
    .filter((item) => item.Ssd !== ssd && (!current.imageId || item.imageId !== current.imageId))
    .map((item) => {
      const candidate = getImageTaxonomy(item);
      const sharedTags = candidate?.tags.filter((tag) => currentTags.has(tag)).length ?? 0;
      return {
        item,
        sharedTags,
        sameCategory: Number(Boolean(taxonomy && candidate?.category === taxonomy.category)),
        distance: Math.abs(indexes.get(item)! - currentIndex),
      };
    })
    .sort((a, b) => b.sharedTags - a.sharedTags || b.sameCategory - a.sameCategory || a.distance - b.distance)
    .slice(0, Math.max(0, limit))
    .map(({ item }) => item);

  return related;
}

export function getAdjacentWallpapers(ssd: string, locale: Locale = defaultLocale) {
  const wallpapers = getAllWallpapers(locale)
  return getAdjacentWallpapersFromList(wallpapers, ssd)
}

export function getAdjacentWallpapersFromList(
  wallpapers: WallpaperItem[],
  ssd: string
) {
  const currentIndex = wallpapers.findIndex((wallpaper) => wallpaper.Ssd === ssd)

  if (currentIndex === -1) {
    return {
      previous: null,
      next: null,
    }
  }

  return {
    previous: wallpapers[currentIndex + 1] ?? null,
    next: wallpapers[currentIndex - 1] ?? null,
  }
}

export function getDateParts(ssd: string): DateParts | null {
  const match = ssd.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  return { year, month, day };
}

export function getYearOptions(wallpapers: WallpaperItem[]) {
  const years = wallpapers
    .map((item) => getDateParts(item.Ssd)?.year)
    .filter((value): value is string => Boolean(value));

  return [...new Set(years)].sort((a, b) => Number(b) - Number(a));
}

export function getMonthOptions(wallpapers: WallpaperItem[], year?: string) {
  const months = wallpapers
    .map((item) => getDateParts(item.Ssd))
    .filter((parts): parts is DateParts => Boolean(parts))
    .filter((parts) => !year || parts.year === year)
    .map((parts) => parts.month);

  return [...new Set(months)].sort((a, b) => Number(a) - Number(b));
}

export function filterWallpapersByDate(
  wallpapers: WallpaperItem[],
  year?: string,
  month?: string
) {
  if (!year && !month) return wallpapers;

  return wallpapers.filter((wallpaper) => {
    const parts = getDateParts(wallpaper.Ssd);
    if (!parts) return false;
    if (year && parts.year !== year) return false;
    if (month && parts.month !== month) return false;
    return true;
  });
}

type SearchField = "title" | "desc" | "copyright" | "date" | "ssd";

interface SearchClause {
  excludes: string[];
  fields: Array<{ field: SearchField; value: string }>;
  phrase: string;
}

interface SearchHighlightTerms {
  title: string[];
  description: string[];
}

function normalizeSearchValue(value?: string) {
  return value?.normalize("NFKC").trim().toLowerCase() ?? "";
}

function parseSearchClause(clause: string): SearchClause {
  const excludes: string[] = [];
  const fields: Array<{ field: SearchField; value: string }> = [];
  let remaining = clause;

  remaining = remaining.replace(
    /(^|\s)-(("[^"]+")|(\S+))/g,
    (_match, leadingWhitespace: string, token: string) => {
      const normalizedToken = normalizeSearchValue(token.replace(/^"|"$/g, ""));
      if (normalizedToken) {
        excludes.push(normalizedToken);
      }
      return leadingWhitespace;
    }
  );

  remaining = remaining.replace(
    /(^|\s)(title|desc|description|copyright|date|ssd):(("[^"]+")|(\S+))/g,
    (
      _match,
      leadingWhitespace: string,
      rawField: string,
      token: string
    ) => {
      const field =
        rawField === "description" ? "desc" : (rawField as SearchField);
      const normalizedToken = normalizeSearchValue(token.replace(/^"|"$/g, ""));

      if (normalizedToken) {
        fields.push({ field, value: normalizedToken });
      }

      return leadingWhitespace;
    }
  );

  return {
    excludes,
    fields,
    phrase: normalizeSearchValue(remaining),
  };
}

function matchesSearchClause(wallpaper: WallpaperItem, clause: SearchClause) {
  const haystack = [
    wallpaper.Ssd,
    wallpaper.FullDateString,
    wallpaper.ImageContent?.Title,
    wallpaper.ImageContent?.Description,
    wallpaper.ImageContent?.Copyright,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const fieldHaystacks: Record<SearchField, string> = {
    title: normalizeSearchValue(wallpaper.ImageContent?.Title),
    desc: normalizeSearchValue(wallpaper.ImageContent?.Description),
    copyright: normalizeSearchValue(wallpaper.ImageContent?.Copyright),
    date: normalizeSearchValue(wallpaper.FullDateString ?? wallpaper.Ssd),
    ssd: normalizeSearchValue(wallpaper.Ssd),
  };

  if (clause.excludes.some((term) => haystack.includes(term))) {
    return false;
  }

  if (
    clause.fields.some(({ field, value }) => !fieldHaystacks[field].includes(value))
  ) {
    return false;
  }

  if (clause.phrase && !haystack.includes(clause.phrase)) {
    return false;
  }

  return clause.fields.length > 0 || clause.excludes.length > 0 || Boolean(clause.phrase);
}

function scoreSearchClause(wallpaper: WallpaperItem, clause: SearchClause) {
  const title = normalizeSearchValue(wallpaper.ImageContent?.Title);
  const description = normalizeSearchValue(wallpaper.ImageContent?.Description);
  const copyright = normalizeSearchValue(wallpaper.ImageContent?.Copyright);
  const date = normalizeSearchValue(wallpaper.FullDateString ?? wallpaper.Ssd);
  const ssd = normalizeSearchValue(wallpaper.Ssd);
  let score = 0;

  if (clause.phrase) {
    if (title === clause.phrase) score += 120;
    else if (title.includes(clause.phrase)) score += 90;
    else if (description.includes(clause.phrase)) score += 60;
    else if (copyright.includes(clause.phrase)) score += 40;
    else if (date.includes(clause.phrase) || ssd.includes(clause.phrase)) score += 30;
  }

  for (const { field, value } of clause.fields) {
    if (field === "title") {
      score += title === value ? 110 : title.includes(value) ? 85 : 0;
    }

    if (field === "desc") {
      score += description.includes(value) ? 65 : 0;
    }

    if (field === "copyright") {
      score += copyright.includes(value) ? 45 : 0;
    }

    if (field === "date") {
      score += date.includes(value) ? 35 : 0;
    }

    if (field === "ssd") {
      score += ssd.includes(value) ? 35 : 0;
    }
  }

  return score;
}

export function getSearchHighlightTerms(query?: string): SearchHighlightTerms {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return {
      title: [],
      description: [],
    };
  }

  const titleTerms = new Set<string>();
  const descriptionTerms = new Set<string>();
  const clauses = normalizedQuery
    .split(",")
    .map((term) => parseSearchClause(term.trim()))
    .filter(Boolean);

  for (const clause of clauses) {
    if (clause.phrase) {
      titleTerms.add(clause.phrase);
      descriptionTerms.add(clause.phrase);
    }

    for (const fieldEntry of clause.fields) {
      if (fieldEntry.field === "title") {
        titleTerms.add(fieldEntry.value);
      }

      if (fieldEntry.field === "desc") {
        descriptionTerms.add(fieldEntry.value);
      }

      if (fieldEntry.field === "date" || fieldEntry.field === "ssd") {
        titleTerms.add(fieldEntry.value);
        descriptionTerms.add(fieldEntry.value);
      }
    }
  }

  return {
    title: [...titleTerms].sort((a, b) => b.length - a.length),
    description: [...descriptionTerms].sort((a, b) => b.length - a.length),
  };
}

export function searchWallpapers(wallpapers: WallpaperItem[], query?: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return wallpapers;

  const clauses = normalizedQuery
    .split(",")
    .map((term) => parseSearchClause(term.trim()))
    .filter(Boolean);

  return wallpapers
    .map((wallpaper) => {
      const matchingClauses = clauses.filter((clause) => matchesSearchClause(wallpaper, clause));
      const score = matchingClauses.reduce(
        (highest, clause) => Math.max(highest, scoreSearchClause(wallpaper, clause)),
        0
      );

      return {
        wallpaper,
        score,
      };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.wallpaper.Ssd.localeCompare(left.wallpaper.Ssd);
    })
    .map(({ wallpaper }) => wallpaper);
}

export function paginateWallpapers(wallpapers: WallpaperItem[], page: number) {
  const totalPages = Math.max(1, Math.ceil(wallpapers.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;

  return {
    currentPage,
    totalPages,
    items: wallpapers.slice(start, start + PAGE_SIZE),
  };
}
