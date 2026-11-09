"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import ResponsivePanel from "@/components/responsive-panel";
import WaterfallFilterLink from "@/components/waterfall-filter-link";
import { taxonomyUiLabel } from "@/lib/taxonomy-ui-labels";
import type { Locale } from "@/lib/i18n";

interface CountryOption {
  id: string;
  label: string;
  searchText: string;
  flag: string | null;
  count: number;
  href: string;
}

export default function CountryFilter({ locale, value, options, clearHref }: {
  locale: Locale;
  value: string;
  options: CountryOption[];
  clearHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const selected = options.find((option) => option.id === value);
  const search = query.trim().toLocaleLowerCase(locale);
  const results = options.filter((option) => option.searchText.toLocaleLowerCase(locale).includes(search));
  const label = taxonomyUiLabel("countries", locale);
  const allLabel = taxonomyUiLabel("allCountries", locale);

  function close(restoreFocus = false) {
    setOpen(false);
    setQuery("");
    if (restoreFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    document.addEventListener("pointerdown", dismiss);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    const links = Array.from(panelRef.current?.querySelectorAll<HTMLAnchorElement>("[data-country-option]") ?? []);
    const index = links.indexOf(event.target as HTMLAnchorElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (links.length) {
        const delta = event.key === "ArrowDown" ? 1 : -1;
        const next = index < 0 ? (delta > 0 ? 0 : links.length - 1) : (index + delta + links.length) % links.length;
        links[next]?.focus();
      }
    } else if (event.key === "Enter" && event.target === searchRef.current) {
      event.preventDefault();
      links[0]?.focus();
    }
  }

  return (
    <nav aria-label={label} className="flex min-w-0 flex-col gap-2">
      <span className="text-xs font-medium text-stone-400">{label}</span>
      <div ref={containerRef} className="relative w-full" onKeyDown={open ? handleKeyDown : undefined}
        onBlur={(event) => {
          if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) close();
        }}>
        <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls={panelId}
          aria-label={`${label}: ${selected ? `${selected.label} ${selected.id}` : allLabel}`} data-selected={!!value || undefined}
          className="country-filter-trigger theme-filter-field flex h-12 w-full items-center gap-2.5 rounded-xl border px-3 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-amber-300"
          onClick={() => open ? close() : setOpen(true)}>
          {selected?.flag ? <Image src={selected.flag} alt="" width={20} height={14} className="filter-country-flag" /> : (
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-stone-500">
              <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3" />
              <ellipse cx="10" cy="10" rx="3" ry="7" stroke="currentColor" strokeWidth="1.3" />
              <path d="M3 10h14" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          )}
          <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
            <span className="truncate">{selected?.label ?? allLabel}</span>
            {selected ? <span className="shrink-0 text-[10px] tracking-wide opacity-60">{selected.id}</span> : null}
          </span>
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className={`h-4 w-4 shrink-0 text-stone-500 ${open ? "rotate-180" : ""}`}>
            <path d="m4.5 6.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <ResponsivePanel open={open} onClose={() => close(true)} id={panelId} contentRef={panelRef} returnFocusRef={triggerRef}
          label={label} className="country-filter-panel absolute right-0 top-[calc(100%+0.625rem)] z-30">
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
            <span className="text-sm font-medium text-stone-200">{label}</span>
            <button type="button" onClick={() => close(true)} aria-label={taxonomyUiLabel("close", locale)} className="date-filter-close">
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-4 w-4"><path d="m5 5 6 6m0-6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="px-3 pb-3">
            <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)}
              aria-label={taxonomyUiLabel("searchCountries", locale)} placeholder={taxonomyUiLabel("searchCountries", locale)}
              autoComplete="off" className="country-filter-search theme-filter-field h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-300" />
          </div>
          <div className="country-filter-results max-h-64 overflow-y-auto overscroll-contain p-1.5 pt-0">
            {!search ? <WaterfallFilterLink prefetch={false} href={clearHref} data-country-option aria-current={!value ? "true" : undefined}
              onClick={() => close(true)} className="country-filter-option">
              <span className="flex-1">{allLabel}</span>
              {!value ? <span aria-hidden="true">✓</span> : null}
            </WaterfallFilterLink> : null}
            {results.map((option) => <WaterfallFilterLink prefetch={false} key={option.id} href={option.href} data-country-option
              aria-current={option.id === value ? "true" : undefined} onClick={() => close(true)} className="country-filter-option">
              {option.flag ? <Image src={option.flag} alt="" width={20} height={14} className="filter-country-flag" /> : null}
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="min-w-0 break-words">{option.label}</span>
                <span className="shrink-0 text-[10px] tracking-wide opacity-60">{option.id}</span>
              </span>
              <span className="text-xs tabular-nums opacity-60">{option.count}</span>
              {option.id === value ? <span aria-hidden="true">✓</span> : null}
            </WaterfallFilterLink>)}
            {results.length === 0 ? <p role="status" className="px-3 py-6 text-center text-sm text-stone-500">{taxonomyUiLabel("noCountries", locale)}</p> : null}
          </div>
        </ResponsivePanel>
      </div>
    </nav>
  );
}
