import type { ReactNode } from "react";

export default function WaterfallFilters({ yearFilters, categories, tags, countries }: {
  yearFilters: ReactNode;
  categories: ReactNode;
  tags: ReactNode;
  countries: ReactNode;
}) {
  return (
    <section className="theme-waterfall-year-strip space-y-3 rounded-[1.5rem] border border-white/10 bg-stone-950/78 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5">
      {yearFilters}
      {categories}
      {tags}
      {countries}
    </section>
  );
}
