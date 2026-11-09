import { normalizeSearchValue, parseSearchQuery, positiveSearchClauses, type SearchClause, type SearchExpression, type SearchField } from "@/lib/search-query";
import { filterWallpapersByTaxonomy, getImageTaxonomy } from "@/lib/image-taxonomy";
import data from "@/db/media_contents.json";
import { getWallpaperFilters, wallpaperFilterKeys, type WallpaperFilters } from "@/lib/wallpaper-filters";
import { defaultLocale, type Locale } from "@/lib/i18n";

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
  // Select in one pass; only the final, deduplicated records need sorting.
  for (const item of items) {
    const key = archiveDateKey(item.Ssd);
    const previous = byDate.get(key);
    const isAI = item.Translation?.generatedBy === "AI";
    const previousIsAI = previous?.Translation?.generatedBy === "AI";
    if (!previous || (previousIsAI && !isAI) ||
        (isAI === previousIsAI && item.Ssd.localeCompare(previous.Ssd) >= 0)) {
      byDate.set(key, item);
    }
  }
  return [...byDate.values()].sort((a, b) => b.Ssd.localeCompare(a.Ssd));
}

// Initialize only the requested language in each Worker isolate.
const archivesByLocale = new Map<Locale, {
  items: WallpaperItem[];
  dates: Map<string, WallpaperItem>;
  indexes: Map<string, WallpaperItem>;
}>();
let knownArchiveIds: Set<string> | undefined;
function getArchive(locale: Locale) {
  let archive = archivesByLocale.get(locale);
  if (!archive) {
    const items = selectWallpaperRecords(wallpaperArchive.mediaContents[locale]);
    archive = {
      items,
      dates: new Map(items.map((item) => [archiveDateKey(item.Ssd), item])),
      indexes: new Map(items.map((item) => [item.Ssd, item])),
    };
    archivesByLocale.set(locale, archive);
  }
  return archive;
}

// Bounded caches: query parameters must not grow isolate memory indefinitely.
function remember<K, V>(cache: Map<K, V>, key: K, value: V, limit: number) {
  if (cache.size >= limit) cache.delete(cache.keys().next().value!);
  cache.set(key, value);
  return value;
}
const filteredArchives = new Map<string, WallpaperItem[]>();
export function getFilteredWallpapers(locale: Locale, source: WallpaperFilters = {}) {
  const filters = getWallpaperFilters(source);
  const key = JSON.stringify([locale, ...wallpaperFilterKeys.map((field) => filters[field])]);
  const cached = filteredArchives.get(key);
  if (cached) return cached;
  const result = filterWallpapersByTaxonomy(searchWallpapers(
    filterWallpapersByDate(getAllWallpapers(locale), filters.year, filters.month), filters.q
  ), filters.category, filters.tag, filters.country);
  if (key.length <= 1024) remember(filteredArchives, key, result, 64);
  return result;
}

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
  return getArchive(locale).items;
}

export function getWallpaperBySsd(ssd: string, locale: Locale = defaultLocale) {
  const archive = getArchive(locale);
  const exact = archive.indexes.get(ssd);
  if (exact) return exact;
  knownArchiveIds ??= new Set(Object.values(wallpaperArchive.mediaContents).flatMap((items) => items.map((item) => item.Ssd)));
  return knownArchiveIds.has(ssd) ? archive.dates.get(archiveDateKey(ssd)) : undefined;
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

const relatedByList = new WeakMap<WallpaperItem[], Map<string, WallpaperItem[]>>();
export function getRelatedWallpapersFromList(
  wallpapers: WallpaperItem[],
  ssd: string,
  limit = 3
) {
  const count = Math.min(wallpapers.length, Math.max(0, Math.trunc(limit)));
  if (!count) return [];
  let cache = relatedByList.get(wallpapers);
  if (!cache) {
    cache = new Map();
    relatedByList.set(wallpapers, cache);
  }
  const key = JSON.stringify([ssd, count]);
  const cached = cache.get(key);
  if (cached) return cached;
  const currentIndex = wallpapers.findIndex((wallpaper) => wallpaper.Ssd === ssd);
  if (currentIndex === -1) {
    return remember(cache, key, wallpapers.slice(0, count), 64);
  }
  const current = wallpapers[currentIndex];
  const taxonomy = getImageTaxonomy(current);
  const tags = new Set(taxonomy?.tags ?? []);
  type Candidate = { item: WallpaperItem; shared: number; category: number; distance: number };
  const best: Candidate[] = [];
  const compare = (a: Candidate, b: Candidate) =>
    b.shared - a.shared || b.category - a.category || a.distance - b.distance;
  // Keep just the best results. Equal scores retain the original archive order.
  for (let index = 0; index < wallpapers.length; index++) {
    const item = wallpapers[index];
    if (item.Ssd === ssd || (current.imageId && item.imageId === current.imageId)) continue;
    const candidateTaxonomy = getImageTaxonomy(item);
    let shared = 0;
    for (const tag of candidateTaxonomy?.tags ?? []) if (tags.has(tag)) shared++;
    const candidate: Candidate = {
      item, shared,
      category: Number(Boolean(taxonomy && candidateTaxonomy?.category === taxonomy.category)),
      distance: Math.abs(index - currentIndex),
    };
    if (best.length === count && compare(candidate, best[best.length - 1]) >= 0) continue;
    const position = best.findIndex((entry) => compare(candidate, entry) < 0);
    best.splice(position === -1 ? best.length : position, 0, candidate);
    if (best.length > count) best.pop();
  }
  return remember(cache, key, best.map(({ item }) => item), 64);
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

const datesByList = new WeakMap<WallpaperItem[], Map<string, WallpaperItem[]>>();
export function filterWallpapersByDate(
  wallpapers: WallpaperItem[],
  year?: string,
  month?: string
) {
  if (!year && !month) return wallpapers;

  let cache = datesByList.get(wallpapers);
  if (!cache) {
    cache = new Map();
    datesByList.set(wallpapers, cache);
  }
  const key = JSON.stringify([year ?? "", month ?? ""]);
  const cached = cache.get(key);
  if (cached) return cached;
  const result = wallpapers.filter((wallpaper) => {
    const parts = getDateParts(wallpaper.Ssd);
    if (!parts) return false;
    if (year && parts.year !== year) return false;
    if (month && parts.month !== month) return false;
    return true;
  });
  return remember(cache, key, result, 32);
}

interface SearchHighlightTerms {
  title: string[];
  description: string[];
}

const searchDocuments = new WeakMap<WallpaperItem, { haystack: string; fields: Record<SearchField, string> }>();
function getSearchDocument(wallpaper: WallpaperItem) {
  const cached = searchDocuments.get(wallpaper);
  if (cached) return cached;
  const haystack = [
    wallpaper.Ssd,
    wallpaper.FullDateString,
    wallpaper.ImageContent?.Title,
    wallpaper.ImageContent?.Description,
    wallpaper.ImageContent?.Copyright,
  ]
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC").toLowerCase();

  const fields: Record<SearchField, string> = {
    title: normalizeSearchValue(wallpaper.ImageContent?.Title),
    desc: normalizeSearchValue(wallpaper.ImageContent?.Description),
    copyright: normalizeSearchValue(wallpaper.ImageContent?.Copyright),
    date: normalizeSearchValue(wallpaper.FullDateString ?? wallpaper.Ssd),
    ssd: normalizeSearchValue(wallpaper.Ssd),
  };

  const document = { haystack, fields };
  searchDocuments.set(wallpaper, document);
  return document;
}

function matchesSearchClause(wallpaper: WallpaperItem, clause: SearchClause) {
  const { haystack, fields: fieldHaystacks } = getSearchDocument(wallpaper);
  if (clause.excludes.some((term) => haystack.includes(term))) {
    return false;
  }

  if (
    clause.fields.some(({ field, value, dateRange }) => {
      if (dateRange === null) return true;
      if (dateRange) {
        const date = archiveDateKey(wallpaper.Ssd);
        return !/^\d{8}$/.test(date) || date < dateRange.start || date > dateRange.end;
      }
      return !fieldHaystacks[field].includes(value);
    })
  ) {
    return false;
  }

  if (clause.phrase && !haystack.includes(clause.phrase)) {
    return false;
  }

  return clause.fields.length > 0 || clause.excludes.length > 0 || Boolean(clause.phrase);
}

function scoreSearchClause(wallpaper: WallpaperItem, clause: SearchClause) {
  const { fields: { title, desc: description, copyright, date, ssd } } = getSearchDocument(wallpaper);
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
  const expression = parseSearchQuery(query);
  const titleTerms = new Set<string>();
  const descriptionTerms = new Set<string>();
  const clauses = expression ? positiveSearchClauses(expression) : [];

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

      if ((fieldEntry.field === "date" || fieldEntry.field === "ssd") && !fieldEntry.dateRange) {
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

function evaluateSearch(wallpaper: WallpaperItem, expression: SearchExpression): number | null {
  if (expression.kind === "clause") {
    return matchesSearchClause(wallpaper, expression.clause)
      ? Math.max(1, scoreSearchClause(wallpaper, expression.clause)) : null;
  }
  if (expression.kind === "not") return evaluateSearch(wallpaper, expression.child) === null ? 1 : null;
  const scores = expression.children.map((child) => evaluateSearch(wallpaper, child));
  if (expression.kind === "and") {
    if (scores.some((score) => score === null)) return null;
    return Math.max(...scores.map((score) => score ?? 0));
  }
  const matches = scores.filter((score): score is number => score !== null);
  return matches.length ? Math.max(...matches) : null;
}

export function hasWallpaperSearchMatch(wallpapers: WallpaperItem[], query: string) {
  const expression = parseSearchQuery(query);
  return Boolean(expression && wallpapers.some((wallpaper) => evaluateSearch(wallpaper, expression) !== null));
}

export function searchWallpapers(wallpapers: WallpaperItem[], query?: string) {
  if (!query?.trim()) return wallpapers;
  const expression = parseSearchQuery(query);
  if (!expression) return [];

  return wallpapers
    .map((wallpaper) => ({ wallpaper, score: evaluateSearch(wallpaper, expression) }))
    .filter((entry): entry is { wallpaper: WallpaperItem; score: number } => entry.score !== null)
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
