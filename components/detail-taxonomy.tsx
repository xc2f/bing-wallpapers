import Link from "next/link";
import { localizePath, type Locale } from "@/lib/i18n";
import { taxonomyUiLabel } from "@/lib/taxonomy-ui-labels";
import { taxonomyLabel } from "@/lib/taxonomy-labels";

export default function DetailTaxonomy({ category, tags, countries = [], locale }: {
  category: string;
  tags: string[];
  countries?: string[];
  locale: Locale;
}) {
  return (
    <div className="px-6 pt-5 lg:px-8">
      <nav aria-label={`${taxonomyUiLabel("categories", locale)} / ${taxonomyUiLabel("tags", locale)} / ${taxonomyUiLabel("countries", locale)}`}
        className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 pb-5 text-xs">
        <Link href={localizePath(locale, `?${new URLSearchParams({ category })}`)}
          className="shrink-0 rounded text-stone-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
          {taxonomyLabel(category, locale, "category")}
        </Link>
        {tags.length > 0 ? <span aria-hidden="true" className="text-stone-500">｜</span> : null}
        {tags.map((tag, index) => (
          <span key={tag} className="inline-flex items-center gap-3">
            {index > 0 ? <span aria-hidden="true" className="text-stone-500">/</span> : null}
            <Link href={localizePath(locale, `?${new URLSearchParams({ tag })}`)}
              className="rounded text-stone-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
              {taxonomyLabel(tag, locale, "tag")}
            </Link>
          </span>
        ))}
        {countries.length > 0 ? <span aria-hidden="true" className="text-stone-500">｜</span> : null}
        {countries.map((country) => (
          <Link key={country} href={localizePath(locale, `?${new URLSearchParams({ country })}`)}
            className="rounded text-stone-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
            {taxonomyLabel(country, locale, "country")}
          </Link>
        ))}
      </nav>
    </div>
  );
}
