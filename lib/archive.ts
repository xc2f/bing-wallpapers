import data from "@/db/media_contents.json";

export const BING_BASE_URL = process.env.BASE_URL
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

interface DateParts {
  year: string;
  month: string;
  day: string;
}

export function toAbsoluteUrl(path?: string) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${BING_BASE_URL}${path}`;
}

export function getAllWallpapers() {
  const wallpapers = (data as WallpaperArchive).mediaContents;
  return [...wallpapers].sort((a, b) => b.Ssd.localeCompare(a.Ssd));
}

export function getWallpaperBySsd(ssd: string) {
  return getAllWallpapers().find((wallpaper) => wallpaper.Ssd === ssd);
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

  for (let offset = 1; related.length < limit; offset += 1) {
    const newerWallpaper = wallpapers[currentIndex - offset];
    const olderWallpaper = wallpapers[currentIndex + offset];

    if (!newerWallpaper && !olderWallpaper) {
      break;
    }

    if (olderWallpaper) {
      related.push(olderWallpaper);
    }

    if (related.length < limit && newerWallpaper) {
      related.push(newerWallpaper);
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

export function searchWallpapers(wallpapers: WallpaperItem[], query?: string) {
  const normalizedTokens = query
    ?.trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (!normalizedTokens?.length) return wallpapers;

  return wallpapers.filter((wallpaper) => {
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

    return normalizedTokens.every((token) => haystack.includes(token));
  });
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
