import type { CSSProperties, ReactNode } from "react";
import type { Locale } from "@/lib/i18n";

const labelWidths: Record<Locale, string> = {
  en: "4.75rem",
  zh: "1.75rem",
  es: "4.75rem",
  fr: "4.75rem",
  de: "5rem",
  ja: "3.5rem",
  ko: "1.75rem",
};

export default function WaterfallFilters({ locale, yearFilters, categories, tags, countries }: {
  locale: Locale;
  yearFilters: ReactNode;
  categories: ReactNode;
  tags: ReactNode;
  countries: ReactNode;
}) {
  return (
    <section style={{ "--waterfall-filter-label-width": labelWidths[locale] } as CSSProperties} className="theme-waterfall-year-strip [--waterfall-filter-column-gap:1rem] [--waterfall-filter-options-inset:calc(var(--waterfall-filter-label-width)+var(--waterfall-filter-column-gap))] space-y-3 rounded-[1.5rem] border border-white/10 bg-stone-950/78 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5">
      {yearFilters}
      {countries}
      {categories}
      {tags}
    </section>
  );
}
