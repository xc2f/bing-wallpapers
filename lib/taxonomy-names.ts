import type { Locale } from "./i18n";

export interface TaxonomyNames {
  defaultLocale?: string;
  locales?: string[];
  categories?: Record<string, Record<string, string>>;
  tags?: Record<string, Record<string, string>>;
}

export type TaxonomyKind = "category" | "tag";

export function resolveTaxonomyLabel(taxonomy: TaxonomyNames | undefined, id: string, locale: Locale, kind: TaxonomyKind) {
  const names = taxonomy?.[kind === "category" ? "categories" : "tags"]?.[id];
  for (const language of [locale, taxonomy?.defaultLocale || "en", "en"]) {
    const name = names?.[language]?.trim();
    if (name) return name;
  }
  return id;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isTaxonomyNames(value: unknown): value is TaxonomyNames {
  if (!isRecord(value)) return false;
  if (value.defaultLocale !== undefined && typeof value.defaultLocale !== "string") return false;
  if (value.locales !== undefined && (!Array.isArray(value.locales) || !value.locales.every((locale) => typeof locale === "string"))) return false;
  return [value.categories, value.tags].every((table) => table === undefined || (
    isRecord(table) && Object.values(table).every((names) =>
      isRecord(names) && Object.values(names).every((name) => typeof name === "string")
    )
  ));
}
