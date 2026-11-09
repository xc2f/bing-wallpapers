"use client";

import { Children, useEffect, useId, useRef, useState, type ReactNode } from "react";

export default function TaxonomyRow({ label, children, expandLabel, collapseLabel }: {
  label: string;
  children: ReactNode;
  expandLabel: string;
  collapseLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const options = Children.toArray(children);
  const [visibleCount, setVisibleCount] = useState(options.length);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    const list = listRef.current;
    if (!list || open) return;
    function measure() {
      const elements = Array.from(list!.children);
      const firstTop = elements[0]?.getBoundingClientRect().top;
      setVisibleCount(elements.filter((element) => Math.abs(element.getBoundingClientRect().top - firstTop!) < 1).length);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [children, open]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !open) return;

    function measureScroll() {
      if (!list) return;
      setCanScrollDown(list.scrollHeight - list.clientHeight - list.scrollTop > 1);
    }

    measureScroll();
    const observer = new ResizeObserver(measureScroll);
    observer.observe(list);
    list.addEventListener("scroll", measureScroll, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", measureScroll);
    };
  }, [children, open]);

  const canExpand = visibleCount < options.length;
  const showScrollCue = open && canScrollDown;

  function toggleExpanded() {
    if (open && listRef.current) {
      // Reset while the list is still scrollable, before clipping to one row.
      listRef.current.scrollTop = 0;
    }
    setOpen(!open);
  }

  return (
    <nav aria-label={label} className="filter-row relative grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-[var(--filter-column-gap,0.75rem)] gap-y-1 sm:flex">
      <span className="filter-row-label w-[var(--filter-label-width,auto)] shrink-0 py-1 text-sm font-medium text-stone-400">{label}</span>
      <div id={listId} ref={listRef}
        className={`col-span-2 row-start-2 flex min-w-0 flex-1 flex-wrap items-start gap-x-2 ${open ? "max-h-48 content-start gap-y-2 overflow-y-auto sm:max-h-none sm:overflow-visible" : "max-h-8 gap-y-2 overflow-hidden supports-[overflow:clip]:overflow-clip"} ${showScrollCue ? "max-sm:[mask-image:linear-gradient(black_calc(100%_-_4rem),transparent)]" : ""}`}>
        {options.map((option, index) => (
          <span key={index} className="inline-flex shrink-0" inert={!open && index >= visibleCount} aria-hidden={!open && index >= visibleCount ? true : undefined}>
            {option}
          </span>
        ))}
      </div>
      {canExpand || open ? (
        <button type="button" aria-expanded={open} aria-controls={listId}
          onClick={toggleExpanded}
          className="filter-row-toggle col-start-2 row-start-1 inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs text-stone-400 transition theme-button-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
          {open ? collapseLabel : expandLabel}
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none"
            className={`block h-4 w-4 shrink-0 ${open ? "rotate-180" : ""}`}>
            <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
    </nav>
  );
}
