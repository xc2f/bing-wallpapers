import type { TranslationMetadata, WallpaperItem } from "@/lib/archive";
import { htmlLangMap, type Dictionary } from "@/lib/i18n";

export default function TranslationNotice({ translation, source, dictionary, field, className = "" }: {
  translation?: TranslationMetadata;
  source?: WallpaperItem;
  dictionary: Dictionary;
  field?: "QuickFact.MainText";
  className?: string;
}) {
  if (translation?.generatedBy !== "AI") return null;

  const notice = translation.reviewedByHuman === false
    ? dictionary.aiTranslationUnreviewedNotice
    : dictionary.aiTranslationNotice;
  const title = field ? undefined : source?.ImageContent?.Title;
  const original = field
    ? source?.ImageContent?.QuickFact?.MainText?.trim()
    : source?.ImageContent?.Description;

  return (
    <div className={className}>
      {original ? (
        <details className="detail-translation-disclosure">
          <summary className="detail-translation-summary group flex w-fit cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-md text-xs leading-5">
            <span className="text-stone-400">{notice}</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-amber-200 underline-offset-4 group-hover:underline group-focus-visible:underline">
              <span className="detail-translation-show">{dictionary.showOriginal}</span>
              <span className="detail-translation-hide">{dictionary.hideOriginal}</span>
              <span aria-hidden="true" className="detail-translation-chevron" />
            </span>
          </summary>
          <div
            lang={translation.sourceLocale ? htmlLangMap[translation.sourceLocale] : undefined}
            className={field
              ? "mt-2 text-sm leading-relaxed text-stone-400"
              : "mt-3 rounded-xl bg-white/[0.03] p-3 text-sm leading-7 text-stone-400"}
          >
            {title ? <p className="mb-2 font-semibold text-stone-200">{title}</p> : null}
            <p className="whitespace-pre-line">{original}</p>
          </div>
        </details>
      ) : <p className="text-xs leading-5 text-stone-400">{notice}</p>}
    </div>
  );
}
