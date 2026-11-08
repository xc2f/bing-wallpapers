import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { taxonomyUiLabel } from "@/lib/taxonomy-ui-labels";

export default function FilterHeading({ locale, children, compact = false }: { locale: Locale; children?: ReactNode; compact?: boolean }) {
  return (
    <div className={`filter-heading flex min-h-9 items-center justify-between gap-3 ${compact ? "filter-heading-compact" : ""}`}>
      <div className="min-w-0">
        {compact ? <h2>{taxonomyUiLabel("filters", locale)}</h2> : <>
        <p className="filter-eyebrow"><span aria-hidden="true" />{taxonomyUiLabel("filters", locale)}</p>
        <h2 className="filter-title">{taxonomyUiLabel("explore", locale)}</h2>
        <p className="filter-description">{taxonomyUiLabel("exploreHint", locale)}</p>
        </>}
      </div>
      {children}
    </div>
  );
}
