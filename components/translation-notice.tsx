import type { TranslationMetadata, WallpaperItem } from "@/lib/archive";
import { htmlLangMap, type Dictionary } from "@/lib/i18n";

export default function TranslationNotice({ translation, source, dictionary, className = "" }: {
  translation?: TranslationMetadata;
  source?: WallpaperItem;
  dictionary: Dictionary;
  className?: string;
}) {
  const { Title: title, Description: description } = source?.ImageContent ?? {};
  if (translation?.generatedBy !== "AI" || !description) return null;

  return (
    <details className={className}>
      <summary className="w-fit cursor-pointer rounded-md text-xs leading-5 text-amber-200 transition-colors hover:text-amber-100">
        {dictionary.showOriginal}
      </summary>
      <div
        lang={translation.sourceLocale ? htmlLangMap[translation.sourceLocale] : undefined}
        className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-stone-400"
      >
        {title ? <p className="mb-2 font-semibold text-stone-200">{title}</p> : null}
        <p className="whitespace-pre-line">{description}</p>
      </div>
    </details>
  );
}
