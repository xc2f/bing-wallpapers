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
      <summary className="detail-translation-summary group flex w-fit cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 rounded-md text-xs leading-5">
        {notice ? <span className="text-stone-400">{notice}</span> : null}
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-amber-200 underline-offset-4 group-hover:underline group-focus-visible:underline">
          {dictionary.showOriginal}
          <span aria-hidden="true" className="detail-translation-chevron" />
        </span>
      </summary>
      <div
        lang={translation.sourceLocale ? htmlLangMap[translation.sourceLocale] : undefined}
        className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-stone-400"
      >
        {title ? <p className="mb-2 font-semibold text-stone-200">{title}</p> : null}
        <p className="whitespace-pre-line">{description}</p>
      </div>
      </details> : notice ? <p className="text-xs leading-5 text-stone-400">{notice}</p> : null}
    </div>
  );
}
