import Link from "next/link";
import { localizePath, type Locale } from "@/lib/i18n";
import { taxonomyLabel } from "@/lib/taxonomy-labels";

export default function DetailTaxonomy({ category, tags, locale }: {
  category: string;
  tags: string[];
  locale: Locale;
}) {
  return (
    <div className="px-6 pt-5 lg:px-8">
      <nav aria-label={`${taxonomyLabel("categories", locale)} / ${taxonomyLabel("tags", locale)}`}
        className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 pb-5 text-xs">
        <Link href={localizePath(locale, `?${new URLSearchParams({ category })}`)}
          className="shrink-0 rounded text-stone-400 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
          {taxonomyLabel(category, locale)}
        </Link>
        {tags.length > 0 ? <span aria-hidden="true" className="text-stone-500">｜</span> : null}
        {tags.map((tag, index) => (
          <span key={tag} className="inline-flex items-center gap-3">
            {index > 0 ? <span aria-hidden="true" className="text-stone-500">/</span> : null}
            <Link href={localizePath(locale, `?${new URLSearchParams({ tag })}`)}
              className="rounded text-stone-400 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
              {taxonomyLabel(tag, locale)}
            </Link>
          </span>
        ))}
      </nav>
    </div>
  );
}
