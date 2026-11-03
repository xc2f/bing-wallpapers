import WaterfallFilterLink from "@/components/waterfall-filter-link";
import TaxonomyRow from "@/components/taxonomy-row";
import Link from "next/link";
import type { WallpaperItem } from "@/lib/archive";
import { filterWallpapersByTaxonomy, getTaxonomyCounts } from "@/lib/image-taxonomy";
import { localizePath, type Locale } from "@/lib/i18n";
import { taxonomyLabel } from "@/lib/taxonomy-labels";

const categoryOrder = ["nature", "animals", "plants", "architecture", "cities", "culture", "space", "other"];

export default function TaxonomyBrowser({ items, locale, filters, pathname = "", mode, fields = ["category", "tag"] }: {
  items: WallpaperItem[];
  locale: Locale;
  pathname?: string;
  mode?: string;
  fields?: Array<"category" | "tag">;
  filters: { q?: string; year?: string; month?: string; category?: string; tag?: string };
}) {
  const FilterLink = pathname === "/waterfall" ? WaterfallFilterLink : Link;

  function href(field: "category" | "tag", value: string) {
    const params = new URLSearchParams();
    for (const [key, current] of Object.entries({ ...filters, [field]: value })) {
      if (current) params.set(key, current);
    }
    if (field === "category") params.delete("tag");
    if (mode) params.set("mode", mode);
    return localizePath(locale, `${pathname}${params.size ? `?${params}` : ""}`);
  }

  function row(field: "category" | "tag") {
    const selected = filters[field] ?? "";
    const candidates = field === "tag" ? filterWallpapersByTaxonomy(items, filters.category) : items;
    const counts = getTaxonomyCounts(candidates, field === "category" ? "category" : "tags");
    const countsById = new Map(counts);
    const orderedCategories = [...categoryOrder, ...counts.map(([id]) => id).filter((id) => !categoryOrder.includes(id))];
    const options: Array<[string, number]> = field === "category"
      ? orderedCategories.map((id) => [id, countsById.get(id) ?? 0])
      : counts;
    if (selected && !options.some(([id]) => id === selected)) {
      options.push([selected, countsById.get(selected) ?? 0]);
    }
    const label = taxonomyLabel(field === "category" ? "categories" : "tags", locale);

    function option(id: string, count?: number) {
      const active = selected === id;
      const text = `${taxonomyLabel(id || "all", locale)}${count === undefined ? "" : ` · ${count}`}`;
      const className = `inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-full px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${active ? "bg-amber-300/10 text-amber-200" : "text-stone-400 hover:bg-white/5 hover:text-white"}`;
      if (count === 0 && !active) {
        return <span key={id} aria-disabled="true" className="shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm text-stone-500 opacity-50">{text}</span>;
      }
      return (
        <FilterLink key={id} href={href(field, active ? "" : id)} scroll={false} aria-current={active ? "true" : undefined}
          aria-label={active && id ? `${taxonomyLabel("remove", locale)}: ${text}` : undefined}
          className={className}>
          {text}
        </FilterLink>
      );
    }

    return (
      <TaxonomyRow
        key={field}
        label={label}
        expandLabel={taxonomyLabel("expand", locale)}
        collapseLabel={taxonomyLabel("collapse", locale)}
      >
        {option("")}
        {options.map(([id, count]) => option(id, count))}
      </TaxonomyRow>
    );
  }
  return <section className="space-y-3">{fields.map((field) => <div key={field}>{row(field)}</div>)}</section>;
}
