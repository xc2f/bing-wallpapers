"use client";

import { useEffect, useState } from "react";

interface ScrollToTopButtonProps {
  label: string;
  showPosition?: boolean;
  totalCount?: number;
}

export default function ScrollToTopButton({
  label,
  showPosition = false,
  totalCount = 0,
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);
  const hasPosition = showPosition && totalCount > 0;

  const ringRadius = 15;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset =
    ringCircumference - (Math.min(Math.max(progressPercent, 0), 100) / 100) * ringCircumference;

  useEffect(() => {
    if (!showPosition || totalCount <= 0) {
      function handleScroll() {
        setVisible(window.scrollY > 640);
        const maxScrollableDistance =
          document.documentElement.scrollHeight - window.innerHeight;
        const nextProgress =
          maxScrollableDistance > 0
            ? (window.scrollY / maxScrollableDistance) * 100
            : 0;
        setProgressPercent(Math.min(Math.max(nextProgress, 0), 100));
      }

      handleScroll();
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleScroll);

      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      };
    }

    function handleScroll() {
      const items = Array.from(
        document.querySelectorAll<HTMLElement>("[data-waterfall-index]")
      );
      const anchorOffset = window.innerHeight - 140;
      const isAtPageBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      let nextIndex = Number(items[0]?.dataset.waterfallIndex ?? "1");

      if (isAtPageBottom) {
        setVisible(window.scrollY > 640);
        // A batch boundary is not necessarily the end of the archive.
        const lastIndex = Math.max(nextIndex, ...items.map((item) => Number(item.dataset.waterfallIndex ?? "1")));
        setCurrentIndex(Math.min(lastIndex, totalCount));
        setProgressPercent(Math.min(lastIndex / totalCount * 100, 100));
        return;
      }

      for (const item of items) {
        const rect = item.getBoundingClientRect();
        const itemIndex = Number(item.dataset.waterfallIndex ?? "1");

        if (rect.bottom <= anchorOffset) {
          nextIndex = itemIndex;
          continue;
        }

        nextIndex = itemIndex;
        break;
      }

      setVisible(window.scrollY > 640);
      const clampedIndex = Math.min(Math.max(1, nextIndex), totalCount);
      setCurrentIndex(clampedIndex);
      setProgressPercent((clampedIndex / totalCount) * 100);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [showPosition, totalCount]);

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      })}
      className={`theme-scroll-top theme-floating-control fixed bottom-[calc(1.25rem_+_env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-30 inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border text-xs font-medium tabular-nums backdrop-blur transition-colors duration-200 sm:bottom-[calc(1.5rem_+_env(safe-area-inset-bottom))] sm:right-[max(1.5rem,env(safe-area-inset-right))] ${hasPosition ? "gap-2 pl-2 pr-3" : "sm:gap-2 sm:pl-2 sm:pr-3"}`}
    >
      <span className="relative flex size-8 shrink-0 items-center justify-center">
        <svg
          viewBox="0 0 36 36"
          className="size-8 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="18"
            cy="18"
            r={ringRadius}
            fill="none"
            stroke="rgb(var(--theme-border-rgb) / 0.12)"
            strokeWidth="1.5"
          />
          <circle
            cx="18"
            cy="18"
            r={ringRadius}
            fill="none"
            className="scroll-top-progress"
            stroke="rgb(var(--theme-accent-ring-rgb))"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeDasharray={ringCircumference}
            strokeDashoffset={ringDashOffset}
          />
        </svg>
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="scroll-top-arrow absolute size-4"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="m4.5 7 3.5-3.5L11.5 7M8 3.5v9"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {hasPosition ? (
        <span>
          {currentIndex}<span className="px-0.5 opacity-60">/</span>{totalCount}
        </span>
      ) : null}
      {!showPosition && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}
