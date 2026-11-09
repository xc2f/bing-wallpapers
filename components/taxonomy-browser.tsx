import type { CSSProperties } from "react";
import WaterfallFilterLink from "@/components/waterfall-filter-link";
import TaxonomyRow from "@/components/taxonomy-row";
import CountryFilter from "@/components/country-filter";
import Image from "next/image";
import { toAbsoluteUrl, type WallpaperItem } from "@/lib/archive";
import { filterWallpapersByTaxonomy, getImageTaxonomy, getTaxonomyCounts } from "@/lib/image-taxonomy";
import { localizePath, type Locale } from "@/lib/i18n";
import { filterLabelWidths, taxonomyUiLabel } from "@/lib/taxonomy-ui-labels";
import { countryFlag, taxonomyLabel } from "@/lib/taxonomy-labels";
import { resizeBingImage } from "@/lib/bing-image";

const categoryOrder = ["nature", "animals", "plants", "architecture", "cities", "culture", "space", "other"];

export default function TaxonomyBrowser({ items, locale, filters, pathname = "", fields = ["category", "tag", "country"] }: {
  items: WallpaperItem[];
  locale: Locale;
  pathname?: string;
  fields?: Array<"category" | "tag" | "country">;
  filters: { q?: string; year?: string; month?: string; category?: string; tag?: string; country?: string };
}) {
  const FilterLink = WaterfallFilterLink;

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

    if (field === "category") {
      const previews = new Map<string, string>();
      for (const item of candidates) {
        const category = getImageTaxonomy(item)?.category;
        const url = toAbsoluteUrl(item.ImageContent?.Image?.Url);
        if (category && url && !previews.has(category)) previews.set(category, resizeBingImage(url, 320, 320));
      }

      function categoryTile(id: string, count?: number) {
        const active = selected === id;
        const name = id ? taxonomyLabel(id, locale, "category") : taxonomyUiLabel("all", locale);
        const preview = previews.get(id);
        const className = `filter-category-card ${!id ? "filter-category-all" : ""}`;
        const content = <>
          {preview ? <Image src={preview} alt="" fill sizes="160px" quality={50} referrerPolicy="no-referrer" className="filter-category-image" /> : (
            <span className="filter-category-art" aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none"><rect x="5" y="5" width="12" height="12" rx="3" /><rect x="23" y="5" width="12" height="12" rx="3" /><rect x="5" y="23" width="12" height="12" rx="3" /><rect x="23" y="23" width="12" height="12" rx="3" /></svg>
            </span>
          )}
          <span className="filter-category-shade" aria-hidden="true" />
          {active ? <span className="filter-category-check" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none"><path d="m2.5 6 2.25 2.25 4.75-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></span> : null}
          <span className="filter-category-caption"><span>{name}</span>{count !== undefined ? <span className="filter-category-count">{count}</span> : null}</span>
        </>;
        if (count === 0 && !active) return <span key={id} aria-disabled="true" className={className}>{content}</span>;
        return <FilterLink key={id} href={href("category", active ? "" : id)} scroll={false} aria-current={active ? "true" : undefined} className={className} aria-label={active && id ? `${taxonomyUiLabel("remove", locale)}: ${name}` : name}>{content}</FilterLink>;
      }

      return <nav aria-label={label} className="filter-category-section">
        <div className="filter-category-grid">{categoryTile("")}{options.map(([id, count]) => categoryTile(id, count))}</div>
      </nav>;
    }

    if (field === "country") {
      return <CountryFilter locale={locale} value={selected} clearHref={href("country", "")} options={options.map(([id, count]) => ({
        id, count, label: taxonomyLabel(id, locale, "country"), flag: countryFlag(id), href: href("country", id),
        searchText: `${taxonomyLabel(id, locale, "country")} ${taxonomyLabel(id, "en", "country")} ${id}`,
      }))} />;
    }

    function option(id: string, count?: number) {
      const active = selected === id;
      const name = id ? taxonomyLabel(id, locale, field) : taxonomyUiLabel("all", locale);
      const text = `${name}${count === undefined ? "" : ` · ${count}`}`;
      const content = <>
        <span>{name}</span>
        {count !== undefined ? <span className="filter-option-count">{count}</span> : null}
      </>;
      const className = "filter-option filter-tag-option inline-flex shrink-0 whitespace-nowrap items-center gap-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300";
      if (count === 0 && !active) {
        return <span key={id} aria-disabled="true" className={`${className} opacity-40`}>{content}</span>;
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
        expandLabel={taxonomyUiLabel("moreTags", locale)}
        collapseLabel={taxonomyUiLabel("collapse", locale)}
      >
        {option("")}
        {options.map(([id, count]) => option(id, count))}
      </TaxonomyRow>
    );
  }
  return (
    <section className="filter-taxonomy filter-label-columns" style={{ "--filter-label-width": filterLabelWidths[locale] } as CSSProperties}>
      {fields.map((field) => <div key={field}>{row(field)}</div>)}
    </section>
  );
}
