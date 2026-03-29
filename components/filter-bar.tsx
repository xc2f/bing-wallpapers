"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type Dictionary, type Locale, formatMonthLabel, localizePath } from "@/lib/i18n";

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

  useEffect(() => {
    setQuery(initialQuery);
    setYear(initialYear);
    setMonth(initialMonth);
  }, [initialMonth, initialQuery, initialYear]);

  const monthOptions = useMemo(() => {
    return year ? yearToMonths[year] ?? [] : allMonthOptions;
  }, [allMonthOptions, year, yearToMonths]);

  useEffect(() => {
    if (month && !monthOptions.includes(month)) {
      setMonth("");
    }
  }, [month, monthOptions]);

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
                placeholder={dictionary.filterSearchPlaceholder}
                className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-5 text-white outline-none backdrop-blur-[12px] transition placeholder:text-stone-500 focus:border-amber-300/45 focus:bg-white/[0.05]"
              />
            </div>
          </label>

          <label className="flex flex-col gap-2 xl:w-[180px]">
            <span className="text-sm text-stone-300">{dictionary.filterYear}</span>
            <div className="relative">
              <select
                name="year"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 pr-11 text-white outline-none backdrop-blur-[12px] transition focus:border-amber-300/45 focus:bg-white/[0.05]"
              >
                <option value="">{dictionary.filterAllYears}</option>
                {yearOptions.map((optionYear) => (
                  <option key={optionYear} value={optionYear} className="bg-stone-950 py-3">
                    {optionYear}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 scale-[0.8] text-stone-500">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="h-4 w-4"
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
            </div>
          </label>

          <label className="flex flex-col gap-2 xl:w-[160px]">
            <span className="text-sm text-stone-300">{dictionary.filterMonth}</span>
            <div className="relative">
              <select
                name="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 pr-11 text-white outline-none backdrop-blur-[12px] transition focus:border-amber-300/45 focus:bg-white/[0.05]"
              >
                <option value="">{dictionary.filterAllMonths}</option>
                {monthOptions.map((optionMonth) => (
                  <option key={optionMonth} value={optionMonth} className="bg-stone-950 py-3">
                    {formatMonthLabel(locale, optionMonth)}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 scale-[0.8] text-stone-500">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="h-4 w-4"
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
            </div>
          </label>

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
