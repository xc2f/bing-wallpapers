import { createHash } from "node:crypto";
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { getAllWallpapers, toAbsoluteUrl } from "../lib/archive";
import { getImageTaxonomy } from "../lib/image-taxonomy";
import { locales } from "../lib/i18n";
import type { DetailIndexItem, DetailIndexSearchFields } from "../lib/detail-browse";

const directory = "public/detail-index";
await mkdir(directory, { recursive: true });
// Remove only artifacts owned by this generator so old hashed files do not accumulate.
for (const name of await readdir(directory)) {
  if (/^(en|zh|es|fr|de|ja|ko)(\.search)?\.[a-f0-9]{16}\.json$/.test(name)) await unlink(`${directory}/${name}`);
}
async function writeIndex(prefix: string, rows: unknown) {
  const json = JSON.stringify(rows);
  const hash = createHash("sha256").update(json).digest("hex").slice(0, 16);
  const name = `${prefix}.${hash}.json`;
  await writeFile(`${directory}/${name}`, json);
  return `/detail-index/${name}`;
}

const manifest: Record<string, { navigation: string; search: string }> = {};
for (const locale of locales) {
  const items = getAllWallpapers(locale);
  const navigation = items.map((item): DetailIndexItem => ({
    Ssd: item.Ssd,
    imageId: item.imageId,
    ImageContent: {
      Title: item.ImageContent?.Title,
      Image: { Url: toAbsoluteUrl(item.ImageContent?.Image?.Url) },
    },
    taxonomy: getImageTaxonomy(item),
  }));
  const search = items.map((item): DetailIndexSearchFields => ({
    FullDateString: item.FullDateString,
    Description: item.ImageContent?.Description,
    Copyright: item.ImageContent?.Copyright,
  }));
  manifest[locale] = {
    navigation: await writeIndex(locale, navigation),
    search: await writeIndex(`${locale}.search`, search),
  };
}
await writeFile("db/detail-index-manifest.json", JSON.stringify(manifest));
console.log("Generated static detail navigation indexes for all languages.");
