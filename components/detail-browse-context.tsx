"use client";

import { createContext, Suspense, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { selectDetailNavigation, type DetailIndexItem, type DetailNavigation } from "@/lib/detail-browse";
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
const indexes = new Map<string, Promise<DetailIndexItem[]>>();
function loadIndex(url: string) {
  let request = indexes.get(url);
  if (!request) {
    request = fetch(url).then((response) => {
      if (!response.ok) throw new Error("Could not load navigation index");
      return response.json() as Promise<DetailIndexItem[]>;
    }).catch((error) => { indexes.delete(url); throw error; });
    // At most one index per currently supported language/build is retained.
    if (indexes.size >= 7) indexes.delete(indexes.keys().next().value!);
    indexes.set(url, request);
  }
  return request;
}
function SearchSync({ onChange }: { onChange: (search: string) => void }) {
  const search = useSearchParams().toString();
  useEffect(() => { onChange(search); }, [onChange, search]);
  return null;
}
export function DetailBrowseProvider({ locale, ssd, initialNavigation, indexUrl, children }: {
  locale: Locale;
  ssd: string;
  initialNavigation: DetailNavigation;
  indexUrl: string;
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
  useEffect(() => {
    if (!hasFilters) return;
    let cancelled = false;
    void loadIndex(indexUrl).then((items) => {
      if (!cancelled) setSelection({ key: filterKey, navigation: selectDetailNavigation(items, ssd, filters) });
    }).catch(() => {
      // Default navigation remains available if the static asset cannot be fetched.
    });
    return () => { cancelled = true; };
  }, [filterKey, filters, hasFilters, indexUrl, ssd]);
  const backParams = new URLSearchParams(params);
  if (params.get("view") === "waterfall") {
    backParams.delete("view");
    backParams.delete("from");
  }
  const backPath = params.get("view") === "waterfall" ? "/waterfall" : "";
  const backSearch = backParams.toString();
  const value: BrowseContext = {
    currentLocale: locale,
    dictionary: getDictionary(locale),
    navigation: hasFilters && selection?.key === filterKey ? selection.navigation : initialNavigation,
    searchParams: Object.fromEntries(params),
    backHref: localizePath(locale, `${backPath}${backSearch ? `?${backSearch}` : ""}`),
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
