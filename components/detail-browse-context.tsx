"use client";

import { createContext, Suspense, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { selectDetailNavigation, type DetailIndexItem, type DetailIndexSearchFields, type DetailNavigation } from "@/lib/detail-browse";
import { getWallpaperFilters, wallpaperFilterKeys } from "@/lib/wallpaper-filters";
import { getDictionary, localizePath, type Locale } from "@/lib/i18n";

interface BrowseContext {
  currentLocale: Locale;
  dictionary: ReturnType<typeof getDictionary>;
  navigation: DetailNavigation;
  searchParams: Record<string, string>;
  backHref: string;
  createDetailHref: (ssd: string) => string;
}
const Context = createContext<BrowseContext | null>(null);
const navigationIndexes = new Map<string, Promise<DetailIndexItem[]>>();
const searchIndexes = new Map<string, Promise<DetailIndexItem[]>>();
async function fetchIndex<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load navigation index");
  return response.json();
}

function loadIndex(indexes: Map<string, Promise<DetailIndexItem[]>>, key: string, load: () => Promise<DetailIndexItem[]>) {
  let request = indexes.get(key);
  if (!request) {
    request = load().catch((error) => {
      if (indexes.get(key) === request) indexes.delete(key);
      throw error;
    });
    // At most one index per currently supported language/build is retained.
    if (indexes.size >= 7) indexes.delete(indexes.keys().next().value!);
    indexes.set(key, request);
  }
  return request;
}
function SearchSync({ onChange }: { onChange: (search: string) => void }) {
  const search = useSearchParams().toString();
  useEffect(() => { onChange(search); }, [onChange, search]);
  return null;
}
export function DetailBrowseProvider({ locale, ssd, initialNavigation, indexUrls, children }: {
  locale: Locale;
  ssd: string;
  initialNavigation: DetailNavigation;
  indexUrls: { navigation: string; search: string };
  children: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<{ key: string; navigation: DetailNavigation } | null>(null);
  const params = useMemo(() => {
    const source = new URLSearchParams(search);
    const result = new URLSearchParams();
    for (const key of [...wallpaperFilterKeys, "page", "view", "from", "mode"]) {
      const value = source.get(key)?.trim();
      if (value) result.set(key, value);
    }
    return result;
  }, [search]);
  const filters = useMemo(() => getWallpaperFilters(Object.fromEntries(params)), [params]);
  const filterKey = JSON.stringify([locale, ssd, ...wallpaperFilterKeys.map((key) => filters[key])]);
  const hasFilters = wallpaperFilterKeys.some((key) => Boolean(filters[key]));
  const { navigation: navigationUrl, search: searchUrl } = indexUrls;
  useEffect(() => {
    if (!hasFilters) return;
    let cancelled = false;
    const navigation = loadIndex(navigationIndexes, navigationUrl, () => fetchIndex(navigationUrl));
    const index = filters.q ? loadIndex(searchIndexes, `${navigationUrl}:${searchUrl}`, async () => {
      const [items, fields] = await Promise.all([navigation, fetchIndex<DetailIndexSearchFields[]>(searchUrl)]);
      if (items.length !== fields.length) throw new Error("Mismatched navigation and search indexes");
      return items.map((item, position) => {
        const { FullDateString, Description, Copyright } = fields[position];
        return { ...item, FullDateString, ImageContent: { ...item.ImageContent, Description, Copyright } };
      });
    }) : navigation;
    void index.then((items) => {
      if (!cancelled) setSelection({ key: filterKey, navigation: selectDetailNavigation(items, ssd, filters) });
    }).catch(() => {
      // Default navigation remains available if the static asset cannot be fetched.
    });
    return () => { cancelled = true; };
  }, [filterKey, filters, hasFilters, navigationUrl, searchUrl, ssd]);
  const backParams = new URLSearchParams(params);
  backParams.delete("view");
  backParams.delete("from");
  backParams.delete("mode");
  const backSearch = backParams.toString();
  const value: BrowseContext = {
    currentLocale: locale,
    dictionary: getDictionary(locale),
    navigation: hasFilters && selection?.key === filterKey ? selection.navigation : initialNavigation,
    searchParams: Object.fromEntries(params),
    backHref: localizePath(locale, `${backSearch ? `?${backSearch}` : ""}`),
    createDetailHref: (target) => localizePath(locale, `/wallpaper/${target}${params.size ? `?${params}` : ""}`),
  };
  return <Context.Provider value={value}>
    <Suspense fallback={null}><SearchSync onChange={setSearch} /></Suspense>
    {children}
  </Context.Provider>;
}
export function useDetailBrowse() {
  const context = useContext(Context);
  if (!context) throw new Error("Missing detail browsing context");
  return context;
}
