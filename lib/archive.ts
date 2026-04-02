import data from "@/db/media_contents.json";

export const BING_BASE_URL = process.env.BASE_URL || "https://www.bing.com";
export const PAGE_SIZE = 12;

export interface WallpaperItem {
  Ssd: string;
  FullDateString?: string;
  ImageContent?: {
    Title?: string;
    Description?: string;
    Copyright?: string;
    Image?: {
      Url?: string;
      Wallpaper?: string;
      Downloadable?: boolean;
    };
  };
}

interface WallpaperArchive {
  mediaContents: WallpaperItem[];
}

const wallpaperArchive = data as WallpaperArchive;
const sortedWallpapers = [...wallpaperArchive.mediaContents].sort((a, b) =>
  b.Ssd.localeCompare(a.Ssd)
);
const wallpaperBySsd = new Map(
  sortedWallpapers.map((wallpaper) => [wallpaper.Ssd, wallpaper] as const)
);

interface DateParts {
  year: string;
  month: string;
  day: string;
}

export function toAbsoluteUrl(path?: string) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${BING_BASE_URL}${path}`;
}

export function toProxyImageUrl(path?: string) {
  const absoluteUrl = toAbsoluteUrl(path);
  if (!absoluteUrl) return "";

  const params = new URLSearchParams({
    url: absoluteUrl,
  });

  return `/api/image?${params.toString()}`;
}

export function getAllWallpapers() {
  return sortedWallpapers;
}

export function getWallpaperBySsd(ssd: string) {
  return wallpaperBySsd.get(ssd);
}

export function getRelatedWallpapers(ssd: string, limit = 3) {
  return getRelatedWallpapersFromList(getAllWallpapers(), ssd, limit);
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

  const related: WallpaperItem[] = [];

  for (let offset = 2; related.length < limit; offset += 1) {
    const newerWallpaper = wallpapers[currentIndex - offset];
    const olderWallpaper = wallpapers[currentIndex + offset];

    if (!newerWallpaper && !olderWallpaper) {
      break;
    }

    if (newerWallpaper) {
      related.push(newerWallpaper);
    }

    if (related.length < limit && olderWallpaper) {
      related.push(olderWallpaper);
    }
  }

  return related;
}

export function getAdjacentWallpapers(ssd: string) {
  const wallpapers = getAllWallpapers()
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
