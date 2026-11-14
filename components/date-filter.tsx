"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { formatMonthLabel, type Dictionary, type Locale } from "@/lib/i18n";
import { taxonomyUiLabel } from "@/lib/taxonomy-ui-labels";
import ResponsivePanel from "@/components/responsive-panel";

interface DateFilterProps {
  name: string;
  locale: Locale;
  dictionary: Dictionary;
  yearOptions: string[];
  yearToMonths: Record<string, string[]>;
  yearValue: string;
  monthValue: string;
  onChange: (year: string, month: string) => void;
}

const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));

function CalendarIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
    <rect x="3" y="4.5" width="14" height="12.5" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M6.5 3v3m7-3v3M3 8.5h14M6.5 12h2m3 0h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>;
}

export default function DateFilter({ name, locale, dictionary, yearOptions, yearToMonths, yearValue, monthValue, onChange }: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(yearValue || yearOptions[0] || "");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const label = monthValue ? `${yearValue} / ${formatMonthLabel(locale, monthValue)}` : yearValue || dictionary.filterAllTime;
  const availableMonths = yearToMonths[viewYear] ?? [];

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function select(year: string, month: string) {
    onChange(year, month);
    close(true);
  }

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      const target = panel?.querySelector<HTMLButtonElement>("[data-month][aria-pressed='true']")
        ?? panel?.querySelector<HTMLButtonElement>("[data-year][aria-pressed='true']")
        ?? panel?.querySelector<HTMLButtonElement>("button");
      target?.focus();
      const year = panel?.querySelector<HTMLElement>("[data-year][aria-pressed='true']");
      const rail = year?.parentElement;
      if (year && rail) rail.scrollLeft = year.offsetLeft - rail.offsetLeft - rail.clientWidth / 2 + year.clientWidth / 2;
    });
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      cancelAnimationFrame(frame);
    };
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    const target = event.target as HTMLElement;
    const group = target.closest("[data-date-group]");
    if (!group || !target.matches("button")) return;
    const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>("button"));
    const index = buttons.indexOf(target as HTMLButtonElement);
    const isMonth = target.hasAttribute("data-month");
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1
      : event.key === "ArrowDown" ? (isMonth ? 3 : 1) : event.key === "ArrowUp" ? (isMonth ? -3 : -1) : 0;
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const enabled = buttons.filter((button) => !button.disabled);
      (event.key === "Home" ? enabled[0] : enabled.at(-1))?.focus();
    } else if (delta) {
      event.preventDefault();
      for (let step = 1; step <= buttons.length; step++) {
        const next = buttons[(index + delta * step + buttons.length * step) % buttons.length];
        if (!next.disabled) {
          next.focus();
          break;
        }
      }
    }
  }

  return (
    <div ref={containerRef} className="date-filter relative" onKeyDown={open ? handleKeyDown : undefined} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      <input type="hidden" name={name} value={monthValue ? `${yearValue}-${monthValue}` : yearValue} />
      <button ref={triggerRef} type="button" className="theme-filter-field date-filter-trigger flex h-12 w-full items-center gap-2.5 rounded-xl border px-3.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-amber-300"
        aria-label={`${dictionary.filterDateLabel}: ${label}`} aria-haspopup="dialog" aria-expanded={open} aria-controls={panelId}
        data-selected={!!yearValue || undefined}
        onClick={() => {
          if (!open) setViewYear(yearValue || yearOptions[0] || "");
          setOpen(!open);
        }}>
        <CalendarIcon />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m4.5 6.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <ResponsivePanel open={open} onClose={() => close(true)} id={panelId} contentRef={panelRef} returnFocusRef={triggerRef} label={dictionary.filterDateDialogLabel} className="date-filter-panel right-0 z-30">
        <div className="date-filter-header">
          <div className="min-w-0"><p className="date-filter-caption">{dictionary.filterDateLabel}</p><p className="date-filter-year">{yearValue || dictionary.filterAllTime}</p></div>
          <button type="button" onClick={() => close(true)} aria-label={taxonomyUiLabel("close", locale)} className="date-filter-close">
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-4 w-4"><path d="m5 5 6 6m0-6-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="date-filter-years" role="group" aria-label={dictionary.activeYear} data-date-group>
          {yearOptions.map((year) => <button key={year} type="button" data-year aria-pressed={yearValue === year} onClick={() => {
            setViewYear(year);
            onChange(year, "");
          }}>{year}</button>)}
        </div>
        <div className="date-filter-months" role="group" aria-label={dictionary.activeMonth} data-date-group>
          {months.map((month) => <button key={month} type="button" data-month disabled={!availableMonths.includes(month)}
            aria-pressed={viewYear === yearValue && month === monthValue}
            aria-label={`${viewYear} / ${formatMonthLabel(locale, month)}`}
            title={!availableMonths.includes(month) ? dictionary.emptyTitle : undefined}
            onClick={() => select(viewYear, month)}>
            {formatMonthLabel(locale, month)}
          </button>)}
        </div>
        <div className="date-filter-footer">
          <button type="button" disabled={!yearValue && !monthValue} onClick={() => select("", "")} className="date-filter-anytime">{dictionary.filterAllTime}</button>
        </div>
      </ResponsivePanel>
    </div>
  );
}
