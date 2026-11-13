import { searchWallpapers } from "@/lib/wallpaper-search";
export { searchWallpapers, getSearchHighlightTerms, hasWallpaperSearchMatch } from "@/lib/wallpaper-search";
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
export function getFilteredWallpapers(locale: Locale, source: WallpaperFilters = {}): WallpaperItem[] {
  const filters = getWallpaperFilters(source);
  const key = JSON.stringify([locale, ...wallpaperFilterKeys.map((field) => filters[field])]);
  const cached = filteredArchives.get(key);
  if (cached) return cached;
  const { q, year, month, category, tag, country } = filters;
  const result = category || tag || country
    ? filterWallpapersByTaxonomy(getFilteredWallpapers(locale, { q, year, month }), category, tag, country)
    : searchWallpapers(filterWallpapersByDate(getAllWallpapers(locale), year, month), q);
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
