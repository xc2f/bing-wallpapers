import type { TranslationMetadata, WallpaperItem } from "@/lib/archive";
import { htmlLangMap, type Dictionary } from "@/lib/i18n";

export default function TranslationNotice({ translation, source, dictionary, className = "" }: {
  translation?: TranslationMetadata;
  source?: WallpaperItem;
  dictionary: Dictionary;
  className?: string;
}) {
  if (translation?.generatedBy !== "AI") return null;

  return (
    <div className={className}>
      <p className="text-xs leading-5 text-stone-500">
      {translation.reviewedByHuman === false
        ? dictionary.aiTranslationUnreviewedNotice
        : dictionary.aiTranslationNotice}
      </p>
      {source?.ImageContent?.Description ? (
        <details className="mt-2">
          <summary className="w-fit cursor-pointer text-xs leading-5 text-amber-200 transition hover:text-amber-100">
            {dictionary.showOriginal}
          </summary>
          <div
            lang={translation.sourceLocale ? htmlLangMap[translation.sourceLocale] : undefined}
            className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-stone-400"
          >
            {source.ImageContent.Title ? <p className="mb-2 font-semibold text-stone-200">{source.ImageContent.Title}</p> : null}
            <p className="whitespace-pre-line">{source.ImageContent.Description}</p>
          </div>
        </details>
      ) : null}
    </div>
  );
}
