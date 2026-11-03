import data from "@/db/image_tags.json";
import type { Locale } from "@/lib/i18n";
import { resolveTaxonomyLabel, type TaxonomyNames, type TaxonomyKind } from "@/lib/taxonomy-names";

// Resolve names on the server so image assignments stay out of client bundles.
const taxonomy = (data as { taxonomy?: TaxonomyNames }).taxonomy;

export function taxonomyLabel(id: string, locale: Locale, kind: TaxonomyKind) {
  return resolveTaxonomyLabel(taxonomy, id, locale, kind);
}
