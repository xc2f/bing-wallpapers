import FilterBar from "@/components/filter-bar";
import TaxonomyBrowser from "@/components/taxonomy-browser";
import { filterWallpapersByDate, getMonthOptions, getYearOptions, type WallpaperItem } from "@/lib/archive";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getSearchExamples } from "@/lib/search-examples";
import { taxonomyLabel } from "@/lib/taxonomy-labels";
import type { WallpaperFilters } from "@/lib/wallpaper-filters";

export default function WaterfallFilters({ locale, filters, allWallpapers, items }: {
  locale: Locale;
  filters: WallpaperFilters;
  allWallpapers: WallpaperItem[];
  items: WallpaperItem[];
}) {
  const { q = "", year = "", month = "", category, tag, country } = filters;
  const yearOptions = getYearOptions(allWallpapers);
  const yearToMonths = Object.fromEntries(yearOptions.map((value) => [value, getMonthOptions(allWallpapers, value)]));

  return <FilterBar
    locale={locale}
    defaultCollapsed
    dictionary={getDictionary(locale)}
    category={category}
    tag={tag}
    country={country}
    categoryLabel={category ? taxonomyLabel(category, locale, "category") : undefined}
    tagLabel={tag ? taxonomyLabel(tag, locale, "tag") : undefined}
    countryLabel={country ? taxonomyLabel(country, locale, "country") : undefined}
    initialQuery={q}
    initialYear={year}
    initialMonth={month}
    yearOptions={yearOptions}
    yearToMonths={yearToMonths}
    searchHelpExamples={getSearchExamples(filterWallpapersByDate(allWallpapers, year, month), locale)}
    taxonomyFilters={<TaxonomyBrowser items={items} locale={locale} filters={filters} />}
  />;
}
