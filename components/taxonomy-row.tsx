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
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
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

  const canExpand = visibleCount < options.length;

  return (
    <nav aria-label={label} className="flex min-w-0 items-start gap-3">
      <span className="shrink-0 py-2 text-sm text-stone-400">{label}</span>
      <div id={listId} ref={listRef}
        className={`flex min-w-0 flex-1 flex-wrap items-start gap-2 ${open ? "" : "max-h-10 overflow-hidden"}`}>
        {options.map((option, index) => (
          <span key={index} className="inline-flex shrink-0" inert={!open && index >= visibleCount} aria-hidden={!open && index >= visibleCount ? true : undefined}>
            {option}
          </span>
        ))}
      </div>
      {canExpand ? (
        <button type="button" aria-expanded={open} aria-controls={listId}
          onClick={() => setOpen((current) => !current)}
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-3 text-sm text-stone-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
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
