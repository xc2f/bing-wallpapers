import type { TranslationMetadata, WallpaperItem } from "@/lib/archive";
import { htmlLangMap, type Dictionary } from "@/lib/i18n";

export default function TranslationNotice({ translation, source, dictionary, notice, className = "" }: {
  translation?: TranslationMetadata;
  source?: WallpaperItem;
  dictionary: Dictionary;
  notice?: string;
  className?: string;
}) {
  const { Title: title, Description: description } = source?.ImageContent ?? {};
  if (translation?.generatedBy !== "AI") return null;

  return (
    <div className={className}>
      {description ? <details>
      <summary className="group flex w-fit cursor-pointer flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md text-xs leading-5">
        {notice ? <span className="text-stone-500" data-display-text="true">{notice}</span> : null}
        <span className="inline-flex items-baseline gap-2 whitespace-nowrap text-amber-200 transition-colors group-hover:text-amber-100">
          {notice ? <span aria-hidden="true" className="text-stone-500">·</span> : null}
          {dictionary.showOriginal}
        </span>
      </summary>
      <div
        lang={translation.sourceLocale ? htmlLangMap[translation.sourceLocale] : undefined}
        className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-stone-400"
      >
        {title ? <p className="mb-2 font-semibold text-stone-200">{title}</p> : null}
        <p className="whitespace-pre-line">{description}</p>
      </div>
      </details> : notice ? <p className="text-xs leading-5 text-stone-500" data-display-text="true">{notice}</p> : null}
    </div>
  );
}
