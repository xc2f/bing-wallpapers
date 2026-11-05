import type { CSSProperties } from "react";
import WaterfallFilterLink from "@/components/waterfall-filter-link";
import TaxonomyRow from "@/components/taxonomy-row";
import Link from "next/link";
import type { WallpaperItem } from "@/lib/archive";
import { filterWallpapersByTaxonomy, getTaxonomyCounts } from "@/lib/image-taxonomy";
import { localizePath, type Locale } from "@/lib/i18n";
import { filterLabelWidths, taxonomyUiLabel } from "@/lib/taxonomy-ui-labels";
import { taxonomyLabel } from "@/lib/taxonomy-labels";

const categoryOrder = ["nature", "animals", "plants", "architecture", "cities", "culture", "space", "other"];

export default function TaxonomyBrowser({ items, locale, filters, pathname = "", fields = ["country", "category", "tag"] }: {
  items: WallpaperItem[];
  locale: Locale;
  pathname?: string;
  fields?: Array<"category" | "tag" | "country">;
  filters: { q?: string; year?: string; month?: string; category?: string; tag?: string; country?: string };
}) {
  const FilterLink = pathname === "/waterfall" ? WaterfallFilterLink : Link;

  function href(field: "category" | "tag" | "country", value: string) {
    const params = new URLSearchParams();
    for (const [key, current] of Object.entries({ ...filters, [field]: value })) {
      if (current) params.set(key, current);
    }
    if (field === "category") params.delete("tag");
    return localizePath(locale, `${pathname}${params.size ? `?${params}` : ""}`);
  }

  function row(field: "category" | "tag" | "country") {
    const selected = filters[field] ?? "";
    const candidates = field === "tag" ? filterWallpapersByTaxonomy(items, filters.category, "", filters.country)
      : field === "category" ? filterWallpapersByTaxonomy(items, "", "", filters.country)
      : filterWallpapersByTaxonomy(items, filters.category, filters.tag);
    const counts = getTaxonomyCounts(candidates, field === "category" ? "category" : field === "tag" ? "tags" : "countries");
    const countsById = new Map(counts);
    const orderedCategories = [...categoryOrder, ...counts.map(([id]) => id).filter((id) => !categoryOrder.includes(id))];
    const options: Array<[string, number]> = field === "category"
      ? orderedCategories.map((id) => [id, countsById.get(id) ?? 0])
      : counts;
    if (selected && !options.some(([id]) => id === selected)) {
      options.push([selected, countsById.get(selected) ?? 0]);
    }
    const label = taxonomyUiLabel(field === "category" ? "categories" : field === "tag" ? "tags" : "countries", locale);

    function option(id: string, count?: number) {
      const active = selected === id;
      const name = id ? taxonomyLabel(id, locale, field) : taxonomyUiLabel("all", locale);
      const text = `${name}${count === undefined ? "" : ` · ${count}`}`;
      const content = <>
        <span>{name}</span>
        {count !== undefined ? <span className="text-xs tabular-nums opacity-60"><span aria-hidden="true">· </span>{count}</span> : null}
      </>;
      const className = `inline-flex shrink-0 whitespace-nowrap items-baseline gap-2 rounded-full px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${active ? "bg-amber-300/10 text-amber-200" : "text-stone-400 theme-button-hover hover:text-white"}`;
      if (count === 0 && !active) {
        return <span key={id} aria-disabled="true" className="inline-flex shrink-0 items-baseline gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm text-stone-500 opacity-50">{content}</span>;
      }
      return (
        <FilterLink key={id} href={href(field, active ? "" : id)} scroll={false} aria-current={active ? "true" : undefined}
          aria-label={active && id ? `${taxonomyUiLabel("remove", locale)}: ${text}` : undefined}
          className={className}>
          {content}
        </FilterLink>
      );
    }

    return (
      <TaxonomyRow
        key={field}
        label={label}
        expandLabel={taxonomyUiLabel("expand", locale)}
        collapseLabel={taxonomyUiLabel("collapse", locale)}
      >
        {option("")}
        {options.map(([id, count]) => option(id, count))}
      </TaxonomyRow>
    );
  }
  return (
    <section className="filter-label-columns space-y-3" style={{ "--filter-label-width": filterLabelWidths[locale] } as CSSProperties}>
      {fields.map((field) => <div key={field}>{row(field)}</div>)}
    </section>
  );
}
