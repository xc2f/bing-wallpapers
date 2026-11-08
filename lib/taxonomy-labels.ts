import data from "@/db/image_tags.json";
import countryFlagCodes from "@/lib/country-flag-codes.json";
import type { Locale } from "@/lib/i18n";
import { resolveTaxonomyLabel, type TaxonomyNames, type TaxonomyKind } from "@/lib/taxonomy-names";

// Resolve names on the server so image assignments stay out of client bundles.
const taxonomy = (data as { taxonomy?: TaxonomyNames }).taxonomy;
const availableFlags = new Set(countryFlagCodes);

export function taxonomyLabel(id: string, locale: Locale, kind: TaxonomyKind) {
  return resolveTaxonomyLabel(taxonomy, id, locale, kind);
}

export function countryFlag(id: string) {
  if (!/^[A-Z]{2}$/.test(id) || !availableFlags.has(id) || !taxonomy?.country?.tags?.[id]) return null;
  return `/flags/${id.toLowerCase()}.svg`;
}
