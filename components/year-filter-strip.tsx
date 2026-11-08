"use client";

import { useEffect, useRef } from "react";
import WaterfallFilterLink from "@/components/waterfall-filter-link";

interface YearFilterStripProps {
  label: string;
  currentYear: string;
  items: Array<{
    href: string;
    label: string;
    active: boolean;
  }>;
}

export default function YearFilterStrip({
  label,
  currentYear,
  items,
}: YearFilterStripProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const activeChip = container.querySelector<HTMLElement>("[data-active='true']");

    if (!activeChip) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const chipRect = activeChip.getBoundingClientRect();
    const nextLeft =
      activeChip.offsetLeft - container.clientWidth / 2 + activeChip.clientWidth / 2;
    const canAnimate = Math.abs(chipRect.left - containerRect.left) > 24;

    container.scrollTo({
      left: Math.max(0, nextLeft),
      behavior: canAnimate ? "smooth" : "auto",
    });
  }, [currentYear, items]);

  return (
    <nav aria-label={label} className="filter-row flex min-w-0 items-start gap-x-[var(--filter-column-gap)]">
      <span className="filter-row-label w-[var(--filter-label-width)] shrink-0 py-2 text-sm font-medium text-stone-400">{label}</span>
      <div
        ref={containerRef}
        className="relative min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [scroll-snap-type:x_proximity] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex min-w-max gap-2">
          {items.map((item) => (
            <WaterfallFilterLink
              key={item.href}
              href={item.href}
              data-active={item.active ? "true" : "false"}
              aria-current={item.active ? "true" : undefined}
              className="filter-option inline-flex snap-start items-center px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {item.label}
            </WaterfallFilterLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
