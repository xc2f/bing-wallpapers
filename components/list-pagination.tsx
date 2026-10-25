import Link from "next/link";

interface ListPaginationProps {
  currentPage: number;
  totalPages: number;
  prevHref: string;
  nextHref: string;
  prevLabel: string;
  nextLabel: string;
}

export default function ListPagination({
  currentPage, totalPages, prevHref, nextHref, prevLabel, nextLabel,
}: ListPaginationProps) {
  const baseClass = "inline-flex min-h-10 items-center rounded-full px-4 py-2 transition";
  const disabledClass = `${baseClass} pointer-events-none border border-white/10 text-stone-600`;

  return (
    <div className="flex items-center gap-3">
      {currentPage > 1 ? (
        <Link href={prevHref} rel="prev" className={`${baseClass} border border-white/15 text-white hover:bg-white/10`}>
          {prevLabel}
        </Link>
      ) : <span aria-disabled="true" className={disabledClass}>{prevLabel}</span>}
      {currentPage < totalPages ? (
        <Link href={nextHref} rel="next" className={`${baseClass} bg-amber-300 text-stone-950 hover:bg-amber-200`}>
          {nextLabel}
        </Link>
      ) : <span aria-disabled="true" className={disabledClass}>{nextLabel}</span>}
    </div>
  );
}
