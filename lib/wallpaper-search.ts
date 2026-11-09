import type { WallpaperItem } from "@/lib/archive";
import { normalizeSearchValue, parseSearchQuery, positiveSearchClauses, type SearchClause, type SearchExpression, type SearchField } from "@/lib/search-query";
function archiveDateKey(ssd: string) {
  return /^\d{8}(?:_|$)/.test(ssd) ? ssd.slice(0, 8) : ssd;
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
