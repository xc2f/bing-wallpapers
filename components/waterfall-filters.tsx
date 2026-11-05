import type { CSSProperties, ReactNode } from "react";
import { filterLabelWidths } from "@/lib/taxonomy-ui-labels";
import type { Locale } from "@/lib/i18n";

export default function WaterfallFilters({ locale, yearFilters, categories, tags, countries }: {
  locale: Locale;
  yearFilters: ReactNode;
  categories: ReactNode;
  tags: ReactNode;
  countries: ReactNode;
}) {
  return (
    <section style={{ "--filter-label-width": filterLabelWidths[locale] } as CSSProperties} className="theme-waterfall-year-strip filter-label-columns space-y-3 rounded-[1.5rem] border border-white/10 bg-stone-950/78 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5">
      {yearFilters}
      {countries}
      {categories}
      {tags}
    </section>
  );
}
