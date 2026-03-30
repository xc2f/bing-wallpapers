"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface YearFilterStripProps {
  allYearsLabel: string;
  currentYear: string;
  items: Array<{
    href: string;
    label: string;
    active: boolean;
  }>;
}

export default function YearFilterStrip({
  allYearsLabel,
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
    <div
      ref={containerRef}
      className="-mx-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [scroll-snap-type:x_proximity] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex min-w-max gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-active={item.active ? "true" : "false"}
            className={`inline-flex snap-start items-center rounded-full px-3 py-1.5 text-sm transition ${
              item.active
                ? "bg-amber-300 text-stone-950 shadow-sm"
                : "border border-white/10 bg-white/[0.03] text-stone-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.active && !item.label.trim() ? allYearsLabel : item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
