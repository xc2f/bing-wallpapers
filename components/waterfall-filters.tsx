import FilterBar from "@/components/filter-bar";
import TaxonomyBrowser from "@/components/taxonomy-browser";
import { filterWallpapersByDate, getDateParts, type WallpaperItem } from "@/lib/archive";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getSearchExamples } from "@/lib/search-examples";
import { taxonomyLabel } from "@/lib/taxonomy-labels";
import type { WallpaperFilters } from "@/lib/wallpaper-filters";

const calendarOptions = new WeakMap<WallpaperItem[], {
  yearOptions: string[];
  yearToMonths: Record<string, string[]>;
}>();

function getCalendarOptions(items: WallpaperItem[]) {
  const cached = calendarOptions.get(items);
  if (cached) return cached;

  const monthsByYear = new Map<string, Set<string>>();
  for (const item of items) {
    const parts = getDateParts(item.Ssd);
    if (!parts) continue;
    let months = monthsByYear.get(parts.year);
    if (!months) {
      months = new Set();
      monthsByYear.set(parts.year, months);
    }
    months.add(parts.month);
  }

  const descending = (a: string, b: string) => Number(b) - Number(a);
  const options = {
    yearOptions: [...monthsByYear.keys()].sort(descending),
    yearToMonths: Object.fromEntries(
      [...monthsByYear].map(([year, months]) => [year, [...months].sort(descending)]),
    ),
  };
  calendarOptions.set(items, options);
  return options;
}

export default function WaterfallFilters({ locale, filters, allWallpapers, items }: {
  locale: Locale;
  filters: WallpaperFilters;
  allWallpapers: WallpaperItem[];
  items: WallpaperItem[];
}) {
  const { q = "", year = "", month = "", category, tag, country } = filters;
  const { yearOptions, yearToMonths } = getCalendarOptions(allWallpapers);

  return <FilterBar
    locale={locale}
    defaultCollapsed
    dictionary={getDictionary(locale)}
    category={category}
    tag={tag}
    country={country}
    categoryLabel={category ? taxonomyLabel(category, locale, "category") : undefined}
    tagLabel={tag ? taxonomyLabel(tag, locale, "tag") : undefined}
    countryLabel={country ? `${taxonomyLabel(country, locale, "country")} ${country}` : undefined}
    initialQuery={q}
    initialYear={year}
    initialMonth={month}
    yearOptions={yearOptions}
    yearToMonths={yearToMonths}
    searchHelpExamples={getSearchExamples(filterWallpapersByDate(allWallpapers, year, month), locale)}
    countryFilter={<TaxonomyBrowser items={items} locale={locale} filters={filters} fields={["country"]} />}
    taxonomyFilters={<TaxonomyBrowser items={items} locale={locale} filters={filters} fields={["category", "tag"]} />}
  />;
}
