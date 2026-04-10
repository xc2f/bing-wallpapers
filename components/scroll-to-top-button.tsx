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
      let nextIndex = 1;

      if (isAtPageBottom) {
        setVisible(window.scrollY > 640);
        setCurrentIndex(totalCount);
        setProgressPercent(100);
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
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="theme-scroll-top fixed bottom-5 right-5 z-30 inline-flex items-center gap-3 rounded-full border border-white/10 bg-stone-950/78 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-stone-200 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur transition duration-200 hover:border-amber-300/40 hover:bg-stone-900/90 hover:text-white sm:bottom-6 sm:right-6"
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
        <svg
          viewBox="0 0 36 36"
          className="-rotate-90 h-9 w-9"
          aria-hidden="true"
        >
          <circle
            cx="18"
            cy="18"
            r={ringRadius}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2"
          />
          <circle
            cx="18"
            cy="18"
            r={ringRadius}
            fill="none"
            stroke="rgb(var(--theme-accent-ring-rgb))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={ringCircumference}
            strokeDashoffset={ringDashOffset}
          />
        </svg>
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="absolute h-3.5 w-3.5 text-stone-100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 13V3M8 3L4.4 6.6M8 3L11.6 6.6"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showPosition && totalCount > 0 ? <span>{currentIndex}/{totalCount}</span> : null}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
