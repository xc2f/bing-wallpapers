"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { type Dictionary, type Locale, formatMonthLabel, localizePath } from "@/lib/i18n";

const FILTER_BAR_COLLAPSED_STORAGE_KEY = "bing-wallpapers-filter-bar-collapsed";

interface CustomSelectOption {
  label: string;
  value: string;
}

interface CustomSelectProps {
  label: string;
  name: string;
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  widthClassName?: string;
}

function CustomSelect({
  label,
  name,
  options,
  value,
  onChange,
  widthClassName,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const selectedOption = options[selectedIndex] ?? options[0];

  useEffect(() => {
    setHighlightedIndex(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    optionRefs.current[highlightedIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedIndex, open]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((current) => Math.min(current + 1, options.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (open) {
        handleSelect(options[highlightedIndex]?.value ?? value);
      } else {
        setOpen(true);
        setHighlightedIndex(selectedIndex);
      }
    }
  }

  function handleOptionKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    optionIndex: number
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex(Math.min(optionIndex + 1, options.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex(Math.max(optionIndex - 1, 0));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setHighlightedIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setHighlightedIndex(options.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect(options[optionIndex]?.value ?? value);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <label className={`flex flex-col gap-2 ${widthClassName ?? ""}`}>
      <span className="text-sm text-stone-300">{label}</span>
      <div ref={containerRef} className="relative">
        <input type="hidden" name={name} value={value} />
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleTriggerKeyDown}
          className="inline-flex h-12 w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 pr-4 text-left text-white outline-none backdrop-blur-[12px] transition hover:bg-white/[0.05] focus:border-amber-300/45 focus:bg-white/[0.05]"
        >
          <span className="truncate">{selectedOption?.label}</span>
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
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-xl border border-white/[0.08] bg-stone-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.32)] backdrop-blur-xl">
            <ul id={listboxId} role="listbox" className="max-h-72 overflow-y-auto py-1">
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = highlightedIndex === index;

                return (
                  <li key={option.value || "__empty__"} role="option" aria-selected={isSelected}>
                    <button
                      ref={(element) => {
                        optionRefs.current[index] = element;
                      }}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onFocus={() => setHighlightedIndex(index)}
                      onKeyDown={(event) => handleOptionKeyDown(event, index)}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                        isHighlighted || isSelected
                          ? "bg-white/[0.08] text-white"
                          : "text-stone-300 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected ? (
                        <span aria-hidden="true" className="text-amber-300">
                          •
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </label>
  );
}

interface FilterBarProps {
  locale: Locale;
  dictionary: Dictionary;
  initialQuery: string;
  initialYear: string;
  initialMonth: string;
  yearOptions: string[];
  allMonthOptions: string[];
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
  allMonthOptions,
  yearToMonths,
  footer,
  resultSummary,
}: FilterBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [collapsed, setCollapsed] = useState(false);
  const [showSearchHelp, setShowSearchHelp] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
    setYear(initialYear);
    setMonth(initialMonth);
  }, [initialMonth, initialQuery, initialYear]);

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

  const monthOptions = useMemo(() => {
    return year ? yearToMonths[year] ?? [] : allMonthOptions;
  }, [allMonthOptions, year, yearToMonths]);

  useEffect(() => {
    if (month && !monthOptions.includes(month)) {
      setMonth("");
    }
  }, [month, monthOptions]);

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

  const yearSelectOptions = useMemo(
    () => [
      { label: dictionary.filterAllYears, value: "" },
      ...yearOptions.map((optionYear) => ({
        label: optionYear,
        value: optionYear,
      })),
    ],
    [dictionary.filterAllYears, yearOptions]
  );

  const monthSelectOptions = useMemo(
    () => [
      { label: dictionary.filterAllMonths, value: "" },
      ...monthOptions.map((optionMonth) => ({
        label: formatMonthLabel(locale, optionMonth),
        value: optionMonth,
      })),
    ],
    [dictionary.filterAllMonths, locale, monthOptions]
  );

  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    function updateViewportState() {
      setIsMobileViewport(window.innerWidth < 640);
    }

    updateViewportState();
    window.addEventListener("resize", updateViewportState);

    return () => {
      window.removeEventListener("resize", updateViewportState);
    };
  }, []);

  function applyFilters(nextQuery: string, nextYear: string, nextMonth: string) {
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
    router.push(href);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters(query, year, month);
  }

  function handleClear() {
    setQuery("");
    setYear("");
    setMonth("");
    router.push(localizePath(locale));
  }

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl sm:p-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="inline-flex items-center gap-2 text-xs tracking-[0.16em] text-stone-400 transition hover:text-white"
          >
            <span>{collapsed ? dictionary.filterExpand : dictionary.filterCollapse}</span>
            <span aria-hidden="true" className="text-sm leading-none">
              {collapsed ? "+" : "-"}
            </span>
          </button>
        </div>

        {!collapsed ? (
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-sm text-stone-300">{dictionary.filterSearch}</span>
              <div className="relative">
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
                  type="search"
                  name="q"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "?" || event.key === "？") {
                      event.preventDefault();
                      setShowSearchHelp(true);
                    }
                  }}
                  placeholder={
                    isMobileViewport
                      ? dictionary.filterSearchHelpHint
                      : dictionary.filterSearchPlaceholder
                  }
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-12 text-white outline-none backdrop-blur-[12px] transition placeholder:text-stone-500 focus:border-amber-300/45 focus:bg-white/[0.05] [&::-webkit-search-cancel-button]:hidden"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-stone-500 transition hover:bg-white/[0.06] hover:text-white"
                    aria-label={dictionary.filterReset}
                  >
                    <span aria-hidden="true" className="text-base leading-none">
                      ×
                    </span>
                  </button>
                ) : null}
                {showSearchHelp ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-20 rounded-xl border border-white/[0.08] bg-stone-950/95 p-4 text-sm text-stone-300 shadow-[0_18px_50px_rgba(0,0,0,0.32)] backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                          {dictionary.filterHelpTitle}
                        </p>
                        <p>{dictionary.filterHelpPhrase}</p>
                        <p>{dictionary.filterHelpOr}</p>
                        <p>{dictionary.filterHelpExclude}</p>
                        <p>{dictionary.filterHelpFields}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSearchHelp(false)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-lg leading-none text-stone-500 transition hover:bg-white/[0.06] hover:text-white"
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </label>

            <CustomSelect
              label={dictionary.filterYear}
              name="year"
              value={year}
              onChange={setYear}
              options={yearSelectOptions}
              widthClassName="xl:w-[180px]"
            />

            <CustomSelect
              label={dictionary.filterMonth}
              name="month"
              value={month}
              onChange={setMonth}
              options={monthSelectOptions}
              widthClassName="xl:w-[160px]"
            />

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(252,211,77,0.98),rgba(245,158,11,0.86))] px-5 text-sm font-medium text-stone-950 transition duration-200 hover:scale-[1.05] hover:brightness-105"
            >
              {dictionary.filterSubmit}
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="inline-flex h-12 items-center justify-center rounded-xl px-4 text-sm font-medium text-stone-300 opacity-60 transition hover:bg-white/[0.06] hover:text-white hover:opacity-100"
            >
              {dictionary.filterReset}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-stone-400">
            {summaryItems.length > 0 ? summaryItems.join(" / ") : dictionary.filterSummaryAll}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-white/[0.05] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-8">{footer}</div>
          <div className="text-right text-sm tracking-[0.1em] text-stone-500">
            {resultSummary}
          </div>
        </div>
      </form>
    </div>
  );
}
