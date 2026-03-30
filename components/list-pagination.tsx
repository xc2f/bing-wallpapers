"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface ListPaginationProps {
  currentPage: number;
  totalPages: number;
  prevHref: string;
  nextHref: string;
  prevLabel: string;
  nextLabel: string;
}

export default function ListPagination({
  currentPage,
  totalPages,
  prevHref,
  nextHref,
  prevLabel,
  nextLabel,
}: ListPaginationProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const prevDisabled = currentPage <= 1 || isPending;
  const nextDisabled = currentPage >= totalPages || isPending;

  function handleNavigate(href: string, disabled: boolean) {
    if (disabled) {
      return;
    }

    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => handleNavigate(prevHref, prevDisabled)}
        disabled={prevDisabled}
        className={`inline-flex min-h-10 items-center rounded-full px-4 py-2 transition ${
          prevDisabled
            ? "pointer-events-none border border-white/10 text-stone-600"
            : "border border-white/15 text-white hover:bg-white/10"
        }`}
      >
        {prevLabel}
      </button>

      <button
        type="button"
        onClick={() => handleNavigate(nextHref, nextDisabled)}
        disabled={nextDisabled}
        className={`inline-flex min-h-10 items-center rounded-full px-4 py-2 transition ${
          nextDisabled
            ? "pointer-events-none border border-white/10 text-stone-600"
            : "bg-amber-300 text-stone-950 hover:bg-amber-200"
        }`}
      >
        {nextLabel}
      </button>
    </div>
  );
}
