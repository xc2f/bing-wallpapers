"use client";

import { taxonomyUiLabel } from "@/lib/taxonomy-ui-labels";
import FilterHeading from "@/components/filter-heading";
import DateFilter from "@/components/date-filter";
import ResponsivePanel from "@/components/responsive-panel";
import { resetWaterfallFilterScroll } from "@/lib/waterfall-filter-navigation";

import type { ReactNode } from "react";
import type { SearchExample } from "@/lib/search-examples";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { type Dictionary, type Locale, formatMonthLabel, localizePath } from "@/lib/i18n";

const FILTER_BAR_COLLAPSED_STORAGE_KEY = "bing-wallpapers-filter-bar-collapsed";
const SEARCH_FIELD_HELP = [
  ["title", "searchFieldTitle"],
  ["desc", "searchFieldDescription"],
  ["copyright", "searchFieldCopyright"],
  ["date", "searchFieldDate"],
  ["ssd", "searchFieldId"],
] as const;

interface FilterBarProps {
  locale: Locale;
  pathname?: "" | "/waterfall";
  defaultCollapsed?: boolean;
  category?: string;
  tag?: string;
  country?: string;
  categoryLabel?: string;
  tagLabel?: string;
  countryLabel?: string;
  dictionary: Dictionary;
  searchHelpExamples: SearchExample[];
  initialQuery: string;
  initialYear: string;
  initialMonth: string;
  yearOptions: string[];
  yearToMonths: Record<string, string[]>;
  taxonomyFilters?: ReactNode;
  countryFilter?: ReactNode;
  footer?: ReactNode;
  resultSummary?: ReactNode;
}

export default function FilterBar({
  locale,
  pathname = "",
  defaultCollapsed = false,
  category,
  tag,
  country,
  categoryLabel,
  tagLabel,
  countryLabel,
  dictionary,
  searchHelpExamples,
  initialQuery,
  initialYear,
  initialMonth,
  yearOptions,
  yearToMonths,
  taxonomyFilters,
  countryFilter,
  footer,
  resultSummary,
}: FilterBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const deferredQuery = useDeferredValue(query);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [storageReady, setStorageReady] = useState(false);
  const collapseStorageKey = `${FILTER_BAR_COLLAPSED_STORAGE_KEY}${pathname ? "-waterfall" : ""}`;
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchAreaRef = useRef<HTMLDivElement | null>(null);
  const searchInputId = useId();
  const searchHelpId = useId();
  const filterContentId = useId();

  useEffect(() => {
    setYear(initialYear);
    setMonth(initialMonth);
  }, [initialMonth, initialYear]);

  useEffect(() => {
    if (isSearchFocused || isComposing) {
      return;
    }

    setQuery(initialQuery);
  }, [initialQuery, isComposing, isSearchFocused]);

  useEffect(() => {
    const savedValue = window.localStorage.getItem(collapseStorageKey);
    setCollapsed(savedValue === null ? defaultCollapsed : savedValue === "true");
    setStorageReady(true);
  }, [collapseStorageKey, defaultCollapsed]);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(
      collapseStorageKey,
      collapsed ? "true" : "false"
    );
  }, [collapseStorageKey, collapsed, storageReady]);

  useEffect(() => {
    if (!showSearchHelp) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowSearchHelp(false);
        if (searchAreaRef.current?.contains(document.activeElement)) searchInputRef.current?.focus();
      }
    }

    function handleOutside(event: PointerEvent) {
      if (!searchAreaRef.current?.contains(event.target as Node)) setShowSearchHelp(false);
    }

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", handleOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handleOutside);
    };
  }, [showSearchHelp]);

  const summaryItems = useMemo(() => {
    const items: Array<{ field: "category" | "tag" | "country" | "q" | "year" | "month"; label: string }> = [];

    if (query.trim()) {
      items.push({ field: "q", label: `${dictionary.activeQuery}: ${query.trim()}` });
    }

    if (year) {
      items.push({ field: "year", label: `${dictionary.activeYear}: ${year}` });
    }

    if (month) {
      items.push({ field: "month", label: `${dictionary.activeMonth}: ${formatMonthLabel(locale, month)}` });
    }

    if (country) items.push({ field: "country", label: `${taxonomyUiLabel("countries", locale)}: ${countryLabel || country}` });
    if (category) items.push({ field: "category", label: `${taxonomyUiLabel("categories", locale)}: ${(categoryLabel || category)}` });
    if (tag) items.push({ field: "tag", label: `${taxonomyUiLabel("tags", locale)}: ${(tagLabel || tag)}` });

    return items;
  }, [category, tag, country, categoryLabel, tagLabel, countryLabel, dictionary.activeMonth, dictionary.activeQuery, dictionary.activeYear, locale, month, query, year]);

  const lastAppliedRef = useRef({
    query: initialQuery,
    year: initialYear,
    month: initialMonth,
  });

  const navigate = useCallback((search = "", replace = true) => {
    const href = localizePath(locale, `${pathname}${search ? `?${search}` : ""}`);
    resetWaterfallFilterScroll(href);
    startTransition(() => {
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    });
  }, [locale, pathname, router]);

  const applyFilters = useCallback((
    nextQuery: string,
    nextYear: string,
    nextMonth: string
  ) => {
    const params = new URLSearchParams();

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    }

    if (nextYear) {
      params.set("year", nextYear);
    }

    if (nextMonth) {
      params.set("month", nextMonth);
    }

    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    if (country) params.set("country", country);
    const search = params.toString();
    navigate(search);
  }, [category, tag, country, navigate]);

  const applyAndRemember = useCallback((
    nextQuery: string,
    nextYear: string,
    nextMonth: string
  ) => {
    lastAppliedRef.current = {
      query: nextQuery,
      year: nextYear,
      month: nextMonth,
    };
    applyFilters(nextQuery, nextYear, nextMonth);
  }, [applyFilters]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isComposing) return;
    applyAndRemember(query, year, month);
  }

  function handleClear() {
    setQuery("");
    setYear("");
    setMonth("");
    lastAppliedRef.current = {
      query: "",
      year: "",
      month: "",
    };
    navigate("", false);
  }

  function removeFilter(field: (typeof summaryItems)[number]["field"]) {
    if (field === "q" || field === "year" || field === "month") {
      const nextQuery = field === "q" ? "" : query;
      const nextYear = field === "year" ? "" : year;
      const nextMonth = field === "year" || field === "month" ? "" : month;
      setQuery(nextQuery);
      setYear(nextYear);
      setMonth(nextMonth);
      applyAndRemember(nextQuery, nextYear, nextMonth);
      return;
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ q: query.trim(), year, month, category, tag, country })) {
      if (value) params.set(key, value);
    }
    params.delete(field);
    if (field === "category") params.delete("tag");
    navigate(params.toString());
  }

  function summaryChips() {
    return summaryItems
      .map(({ field, label }) => (
        <button key={field} type="button" disabled={isPending} onClick={() => removeFilter(field)}
          aria-label={`${taxonomyUiLabel("remove", locale)}: ${label}`}
          className="inline-flex min-h-9 min-w-0 max-w-full items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1 text-xs text-stone-400 transition theme-button-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-40 sm:min-h-8">
          <span className="min-w-0 text-left [overflow-wrap:anywhere]">{label}</span>
          <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" className="h-3 w-3 shrink-0 opacity-60">
            <path d="m3 3 6 6m0-6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      ));
  }

  function handleApplyExample(nextQuery: string) {
    setQuery(nextQuery);
    setShowSearchHelp(false);
    searchInputRef.current?.focus();
  }

  function summaryActions() {
    return (
      <button type="button" onClick={handleClear} disabled={isPending}
        className="theme-button-hover min-h-8 shrink-0 whitespace-nowrap rounded-md px-2 text-xs tabular-nums text-amber-200/85 transition hover:text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:pointer-events-none disabled:opacity-40">
        {dictionary.filterReset}{locale === "zh" || locale === "ja" ? `（${summaryItems.length}）` : ` (${summaryItems.length})`}
      </button>
    );
  }

  useEffect(() => {
    const lastApplied = lastAppliedRef.current;

    if (query !== initialQuery) {
      return;
    }

    if (year === lastApplied.year && month === lastApplied.month) {
      return;
    }

    if (year !== initialYear || month !== initialMonth) {
      applyAndRemember(query, year, month);
    }
  }, [applyAndRemember, initialMonth, initialQuery, initialYear, month, query, year]);

  useEffect(() => {
    if (isComposing) {
      return;
    }

    const trimmedQuery = deferredQuery.trim();
    const lastApplied = lastAppliedRef.current;

    if (
      trimmedQuery === lastApplied.query.trim() &&
      year === lastApplied.year &&
      month === lastApplied.month
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      applyAndRemember(deferredQuery, year, month);
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [applyAndRemember, deferredQuery, isComposing, month, year]);

  return (
    <section aria-label={taxonomyUiLabel("filters", locale)} aria-busy={isPending} className="relative">
      <div
        className="filter-panel relative rounded-[1.75rem] p-5 sm:px-7"
        data-pending={isPending || undefined}
      >
        <FilterHeading locale={locale} compact>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-expanded={!collapsed}
              aria-controls={filterContentId}
              onClick={() => setCollapsed((current) => !current)}
              className="theme-button-hover inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs text-stone-400 transition hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <span>{collapsed ? dictionary.filterExpand : dictionary.filterCollapse}</span>
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none"
                className={`h-4 w-4 shrink-0 ${collapsed ? "" : "rotate-180"}`}>
                <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </FilterHeading>
        <div
          aria-hidden="true"
          className="filter-loading-top"
        />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-3">

          <div id={filterContentId} hidden={collapsed} className="space-y-4">
            {!collapsed ? (
              <div className="filter-search-toolbar grid grid-cols-2 items-end gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_11rem]">
                <div ref={searchAreaRef} className="wallpaper-search relative col-span-2 min-w-0 lg:col-span-1">
                  <div className="wallpaper-search-label-row">
                    <label htmlFor={searchInputId}>{taxonomyUiLabel("search", locale)}</label>
                    <button type="button" className="wallpaper-search-help-toggle" aria-expanded={showSearchHelp} aria-controls={searchHelpId}
                      onClick={() => setShowSearchHelp((current) => !current)}>
                      {dictionary.filterHelpTitle}
                      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className={`h-3 w-3 transition-transform ${showSearchHelp ? "rotate-180" : ""}`}>
                        <path d="m4.5 6.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <div className="wallpaper-search-field">
                    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="wallpaper-search-icon">
                      <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.4" />
                      <path d="m12.5 12.5 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    <input id={searchInputId} ref={searchInputRef} type="search" name="q" value={query}
                      autoComplete="off" spellCheck={false}
                      onChange={(event) => setQuery(event.target.value)}
                      onFocus={() => setIsSearchFocused(true)} onBlur={() => setIsSearchFocused(false)}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={(event) => {
                        setIsComposing(false);
                        setQuery(event.currentTarget.value);
                      }}
                      onKeyDown={(event) => {
                        if (!event.nativeEvent.isComposing && (event.key === "?" || event.key === "？")) {
                          event.preventDefault();
                          setShowSearchHelp(true);
                        }
                      }}
                      placeholder={dictionary.filterSearchPlaceholder}
                    />
                    {query ? <button type="button" className="wallpaper-search-clear" aria-label={dictionary.filterReset}
                      onClick={() => { setQuery(""); searchInputRef.current?.focus(); }}>
                      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5"><path d="m5 5 6 6m0-6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                    </button> : null}
                  </div>
                  <ResponsivePanel open={showSearchHelp} onClose={() => setShowSearchHelp(false)} id={searchHelpId} returnFocusRef={searchInputRef} label={dictionary.filterHelpTitle} className="wallpaper-search-help">
                    <div className="wallpaper-search-help-header">
                      <span>{dictionary.filterHelpExamplesTitle}</span>
                      <button type="button" className="wallpaper-search-clear" aria-label={dictionary.filterHelpClose}
                        onClick={() => { setShowSearchHelp(false); searchInputRef.current?.focus(); }}>
                        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5"><path d="m5 5 6 6m0-6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                    <div className="wallpaper-search-examples">
                      {searchHelpExamples.map((item, index) => <div key={item.query}>
                      <button type="button" className="wallpaper-search-example" onClick={() => handleApplyExample(item.query)}>
                        <span className="wallpaper-search-example-number" aria-hidden="true">0{index + 1}</span>
                        <span className="min-w-0"><code>{item.query}</code><span className="wallpaper-search-example-description">{item.description}</span></span>
                        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0"><path d="M3 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                      {item.isFieldSearch ? <section className="wallpaper-search-fields" aria-label={taxonomyUiLabel("searchFields", locale)}>
                        <dl>
                          {SEARCH_FIELD_HELP.map(([field, label]) => <div key={field}>
                            <dt><code>{field}:</code></dt>
                            <dd>{taxonomyUiLabel(label, locale)}</dd>
                          </div>)}
                        </dl>
                        <p className="wallpaper-search-fields-hint">{taxonomyUiLabel("searchFieldHint", locale)}</p>
                      </section> : null}
                      {item.isCombinedSearch ? <section className="wallpaper-search-combination" aria-label={dictionary.filterHelpTitle}>
                        <dl>
                          {([
                            ["AND", "searchCombineAnd"],
                            ["OR", "searchCombineOr"],
                            ["NOT", "searchCombineNot"],
                            ["( )", "searchCombineGroup"],
                          ] as const).map(([operator, label]) => <div key={operator}>
                            <dt><code>{operator}</code></dt>
                            <dd>{taxonomyUiLabel(label, locale)}</dd>
                          </div>)}
                        </dl>
                        <p className="wallpaper-search-fields-hint">{taxonomyUiLabel("searchCombineOrder", locale)}</p>
                      </section> : null}
                      </div>)}
                      {searchHelpExamples.length === 0 ? <p className="p-4 text-sm text-stone-500">{dictionary.emptyTitle}</p> : null}
                    </div>
                  </ResponsivePanel>
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <span className="text-xs font-medium text-stone-400">{dictionary.filterDateLabel}</span>
                  <DateFilter
                    name="date"
                    yearOptions={yearOptions}
                    yearToMonths={yearToMonths}
                    locale={locale}
                    dictionary={dictionary}
                    yearValue={year}
                    monthValue={month}
                    onChange={(nextYear, nextMonth) => {
                      setYear(nextYear);
                      setMonth(nextMonth);
                    }}
                  />
                </div>

                {countryFilter ? <div className="min-w-0">{countryFilter}</div> : null}

              </div>
            ) : null}
            {!collapsed ? taxonomyFilters : null}
          </div>
          {summaryItems.length > 0 ? (
            <div className={`filter-selection-summary flex items-start justify-between gap-3 ${collapsed ? "" : "section-divider pt-4"}`}>
              <div className="flex min-w-0 flex-1 flex-wrap gap-2">{summaryChips()}</div>
              {summaryActions()}
            </div>
          ) : collapsed ? (
            <div className="flex items-center gap-2 px-1 text-xs leading-5 tracking-[0.08em] text-stone-500">
              {dictionary.filterSummaryAll}
              <span aria-hidden="true" className="text-stone-700">
                ·
              </span>
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="text-amber-200/80 transition hover:text-amber-100"
              >
                {dictionary.filterExpand}
              </button>
            </div>
          ) : null}

          {footer || resultSummary ? <div className="flex flex-col gap-3 section-divider pt-4 sm:flex-row sm:items-center sm:justify-between">
            {footer ? <div className="min-h-8">{footer}</div> : null}
            {resultSummary ? <div className="text-sm tabular-nums text-stone-500 sm:text-right" role="status" aria-live="polite">
              {resultSummary}
            </div> : null}
          </div> : null}
        </form>
      </div>
    </section>
  );
}
