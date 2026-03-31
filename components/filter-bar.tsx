"use client";

import type { ReactNode } from "react";
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

interface DateCascadeSelectProps {
  name: string;
  yearOptions: string[];
  yearToMonths: Record<string, string[]>;
  locale: Locale;
  dictionary: Dictionary;
  yearValue: string;
  monthValue: string;
  onChange: (nextYear: string, nextMonth: string) => void;
  widthClassName?: string;
}

function DateCascadeSelect({
  name,
  yearOptions,
  yearToMonths,
  locale,
  dictionary,
  yearValue,
  monthValue,
  onChange,
  widthClassName,
}: DateCascadeSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeYear, setActiveYear] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  const triggerLabel = monthValue
    ? `${yearValue} / ${formatMonthLabel(locale, monthValue)}`
    : yearValue || dictionary.filterAllTime;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveYear(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (activeYear) {
        setActiveYear(null);
        return;
      }

      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeYear]);

  const activeMonths = activeYear ? yearToMonths[activeYear] ?? [] : [];

  function handleSelectAll() {
    onChange("", "");
    setOpen(false);
    setActiveYear(null);
  }

  function handleSelectYear(nextYear: string) {
    const months = yearToMonths[nextYear] ?? [];

    if (!months.length) {
      onChange(nextYear, "");
      setOpen(false);
      setActiveYear(null);
      return;
    }

    setActiveYear(nextYear);
  }

  function handleSelectMonth(nextMonth: string) {
    if (!activeYear) {
      return;
    }

    onChange(activeYear, nextMonth);
    setOpen(false);
    setActiveYear(null);
  }

  function handleSelectWholeYear() {
    if (!activeYear) {
      return;
    }

    onChange(activeYear, "");
    setOpen(false);
    setActiveYear(null);
  }

  return (
    <div className={`flex flex-col gap-2 ${widthClassName ?? ""}`}>
      <div ref={containerRef} className="relative">
        <input type="hidden" name={name} value={monthValue ? `${yearValue}-${monthValue}` : yearValue} />
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => {
            setOpen((current) => !current);
            setActiveYear(null);
          }}
          className="inline-flex h-12 w-full touch-manipulation items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 pr-4 text-left text-white outline-none transition hover:bg-white/[0.04] focus:border-amber-300/35 focus:bg-white/[0.04]"
        >
          <span className="truncate">{triggerLabel}</span>
          <span
            aria-hidden="true"
            className={`ml-3 shrink-0 text-stone-500 transition ${open ? "rotate-180" : ""}`}
          >
            <svg
              viewBox="0 0 16 16"
              className="h-[18px] w-[18px]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.5 6.25L8 9.75l3.5-3.5"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        {open ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-xl border border-white/[0.08] bg-stone-950">
            {!activeYear ? (
              <ul id={listboxId} role="listbox" className="max-h-72 overflow-y-auto py-1">
                <li role="option" aria-selected={!yearValue && !monthValue}>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className={`flex w-full touch-manipulation items-center justify-between px-4 py-3 text-left text-sm transition ${
                      !yearValue && !monthValue
                        ? "bg-white/[0.06] text-white"
                        : "text-stone-300 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span>{dictionary.filterAllTime}</span>
                    {!yearValue && !monthValue ? (
                      <span aria-hidden="true" className="text-amber-300">•</span>
                    ) : null}
                  </button>
                </li>
                {yearOptions.map((optionYear) => {
                  const isSelectedYear = optionYear === yearValue && !monthValue;
                  const hasMonths = (yearToMonths[optionYear] ?? []).length > 0;

                  return (
                    <li key={optionYear} role="option" aria-selected={isSelectedYear}>
                      <button
                        type="button"
                        onClick={() => handleSelectYear(optionYear)}
                        className={`flex w-full touch-manipulation items-center justify-between px-4 py-3 text-left text-sm transition ${
                          isSelectedYear
                            ? "bg-white/[0.06] text-white"
                            : "text-stone-300 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        <span>{optionYear}</span>
                        <span aria-hidden="true" className={hasMonths ? "text-stone-500" : "text-amber-300"}>
                          {hasMonths ? "›" : "•"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="py-1">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setActiveYear(null)}
                    className="inline-flex touch-manipulation items-center gap-2 text-xs tracking-[0.14em] text-stone-400 transition hover:text-white"
                  >
                    <span aria-hidden="true">‹</span>
                    <span>{dictionary.filterBackToYears}</span>
                  </button>
                  <span className="text-sm text-stone-300">{activeYear}</span>
                </div>
                <ul id={listboxId} role="listbox" className="max-h-72 overflow-y-auto py-1">
                  <li role="option" aria-selected={activeYear === yearValue && !monthValue}>
                  <button
                    type="button"
                    onClick={handleSelectWholeYear}
                    className={`flex w-full touch-manipulation items-center justify-between px-4 py-3 text-left text-sm transition ${
                      activeYear === yearValue && !monthValue
                        ? "bg-white/[0.06] text-white"
                        : "text-stone-300 hover:bg-white/[0.04] hover:text-white"
                    }`}
                    >
                      <span>{activeYear}</span>
                      {activeYear === yearValue && !monthValue ? (
                        <span aria-hidden="true" className="text-amber-300">•</span>
                      ) : null}
                    </button>
                  </li>
                  {activeMonths.map((optionMonth) => {
                    const isSelectedMonth =
                      activeYear === yearValue && optionMonth === monthValue;

                    return (
                      <li key={`${activeYear}-${optionMonth}`} role="option" aria-selected={isSelectedMonth}>
                        <button
                          type="button"
                          onClick={() => handleSelectMonth(optionMonth)}
                          className={`flex w-full touch-manipulation items-center justify-between px-4 py-3 text-left text-sm transition ${
                            isSelectedMonth
                              ? "bg-white/[0.06] text-white"
                              : "text-stone-300 hover:bg-white/[0.04] hover:text-white"
                          }`}
                        >
                          <span>{formatMonthLabel(locale, optionMonth)}</span>
                          {isSelectedMonth ? (
                            <span aria-hidden="true" className="text-amber-300">•</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface FilterBarProps {
  locale: Locale;
  dictionary: Dictionary;
  initialQuery: string;
  initialYear: string;
  initialMonth: string;
  yearOptions: string[];
  yearToMonths: Record<string, string[]>;
  footer?: ReactNode;
  resultSummary: ReactNode;
}

export default function FilterBar({
  locale,
  dictionary,
  initialQuery,
  initialYear,
  initialMonth,
  yearOptions,
  yearToMonths,
  footer,
  resultSummary,
}: FilterBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const deferredQuery = useDeferredValue(query);
  const [collapsed, setCollapsed] = useState(false);
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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
    const savedValue = window.localStorage.getItem(FILTER_BAR_COLLAPSED_STORAGE_KEY);
    if (savedValue === "true") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      FILTER_BAR_COLLAPSED_STORAGE_KEY,
      collapsed ? "true" : "false"
    );
  }, [collapsed]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowSearchHelp(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const summaryItems = useMemo(() => {
    const items: string[] = [];

    if (query.trim()) {
      items.push(`${dictionary.activeQuery}: ${query.trim()}`);
    }

    if (year) {
      items.push(`${dictionary.activeYear}: ${year}`);
    }

    if (month) {
      items.push(`${dictionary.activeMonth}: ${formatMonthLabel(locale, month)}`);
    }

    return items;
  }, [dictionary.activeMonth, dictionary.activeQuery, dictionary.activeYear, locale, month, query, year]);

  const searchHelpExamples = useMemo(
    () => [
      {
        query: "lake bled",
        description: dictionary.filterHelpExamplePhrase,
      },
      {
        query: "turtle, butterfly",
        description: dictionary.filterHelpExampleOr,
      },
      {
        query: "lake -bled",
        description: dictionary.filterHelpExampleExclude,
      },
      {
        query: "title:lake",
        description: dictionary.filterHelpExampleFields,
      },
    ],
    [
      dictionary.filterHelpExampleExclude,
      dictionary.filterHelpExampleFields,
      dictionary.filterHelpExampleOr,
      dictionary.filterHelpExamplePhrase,
    ]
  );

  const lastAppliedRef = useRef({
    query: initialQuery,
    year: initialYear,
    month: initialMonth,
  });

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

    const search = params.toString();
    const href = localizePath(locale, search ? `?${search}` : "");
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }, [locale, router, startTransition]);

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
    startTransition(() => {
      router.push(localizePath(locale));
    });
  }

  function handleApplyExample(nextQuery: string) {
    setQuery(nextQuery);
    setShowSearchHelp(false);
    searchInputRef.current?.focus();
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
    <div className="relative">
      <button
        type="button"
        onClick={() => setCollapsed((current) => !current)}
        className="absolute right-0 top-[-1.5rem] inline-flex items-center gap-2 text-xs tracking-[0.16em] text-stone-500 transition hover:text-stone-200"
      >
        <span>{collapsed ? dictionary.filterExpand : dictionary.filterCollapse}</span>
        <span aria-hidden="true" className="text-sm leading-none">
          {collapsed ? "+" : "-"}
        </span>
      </button>

      <div
        className={`relative rounded-[1.25rem] border border-white/[0.08] bg-stone-950 p-4 transition duration-200 sm:p-5 ${
          isPending ? "border-amber-300/20" : ""
        }`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-2 overflow-hidden rounded-t-[1.25rem]"
        >
          <div className={`filter-loading-bar ${isPending ? "opacity-100" : "opacity-0"}`} />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {!collapsed ? (
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
              <label className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="group relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="h-4 w-4"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="7"
                      cy="7"
                      r="4.25"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M10.5 10.5L13.25 13.25"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <input
                  ref={searchInputRef}
                  type="search"
                  name="q"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={(event) => {
                    setIsComposing(false);
                    setQuery(event.currentTarget.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "?" || event.key === "？") {
                      event.preventDefault();
                      setShowSearchHelp(true);
                    }
                  }}
                  placeholder={dictionary.filterSearchPlaceholder}
                  className="peer h-12 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-12 pr-32 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02)] outline-none transition placeholder:text-stone-500 focus:border-amber-300/35 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(251,191,36,0.08)] [&::-webkit-search-cancel-button]:hidden"
                />
                <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-stone-500 transition hover:bg-white/[0.06] hover:text-white"
                      aria-label={dictionary.filterReset}
                    >
                      <span aria-hidden="true" className="text-base leading-none">
                        ×
                      </span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShowSearchHelp((current) => !current)}
                    className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-[11px] tracking-[0.16em] transition ${
                      showSearchHelp
                        ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                        : "border-white/[0.08] text-stone-500 hover:border-white/[0.14] hover:text-stone-200"
                    }`}
                    aria-expanded={showSearchHelp}
                  >
                    ?
                  </button>
                </div>
                {showSearchHelp ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-20 overflow-hidden rounded-[1.15rem] border border-white/[0.08] bg-stone-950/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    <div className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:px-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <p className="truncate text-sm font-medium text-stone-100">
                            {dictionary.filterHelpTitle}
                          </p>
                          <span className="inline-flex shrink-0 items-center rounded-full border border-white/[0.08] bg-black/20 px-2 py-0.5 text-[10px] tracking-[0.16em] text-stone-400">
                            {dictionary.filterHelpExamplesTitle}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSearchHelp(false)}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base leading-none text-stone-500 transition hover:bg-white/[0.06] hover:text-white"
                          aria-label={dictionary.filterHelpClose}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
                      {searchHelpExamples.map((item) => (
                        <button
                          key={item.query}
                          type="button"
                          onClick={() => handleApplyExample(item.query)}
                          className="group rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3 text-left transition hover:border-amber-300/25 hover:bg-amber-300/8"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <code className="text-sm text-amber-100">{item.query}</code>
                            <span className="text-[10px] tracking-[0.16em] text-stone-500 transition group-hover:text-amber-100/80">
                              {dictionary.filterHelpTryLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-stone-400">
                            {item.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                </div>
              </label>

              <DateCascadeSelect
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
                widthClassName="xl:w-[240px]"
              />

            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-stone-400">
              <span className="min-w-0 truncate">
                {summaryItems.length > 0 ? summaryItems.join(" / ") : dictionary.filterSummaryAll}
              </span>
              {summaryItems.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isPending}
                  className="shrink-0 text-xs tracking-[0.16em] text-amber-200/85 transition hover:text-amber-100 disabled:pointer-events-none disabled:opacity-40"
                >
                  {dictionary.filterReset}
                </button>
              ) : null}
            </div>
          )}

          {!collapsed && summaryItems.length > 0 ? (
            <div className="flex items-start justify-between gap-4">
              <div className="-mx-1 flex flex-wrap gap-2 px-1">
                {summaryItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-xs tracking-[0.12em] text-stone-400"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={handleClear}
                disabled={isPending}
                className="shrink-0 px-1 py-1 text-xs tracking-[0.16em] text-amber-200/85 transition hover:text-amber-100 disabled:pointer-events-none disabled:opacity-40"
              >
                {dictionary.filterReset}
              </button>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-white/[0.04] pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-8">{footer}</div>
            <div className="text-right text-sm tracking-[0.08em] text-stone-500">
              {resultSummary}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
