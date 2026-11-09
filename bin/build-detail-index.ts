import { createHash } from "node:crypto";
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { getAllWallpapers, toAbsoluteUrl } from "../lib/archive";
import { getImageTaxonomy } from "../lib/image-taxonomy";
import { locales } from "../lib/i18n";

const directory = "public/detail-index";
await mkdir(directory, { recursive: true });
// Remove only artifacts owned by this generator so old hashed files do not accumulate.
for (const name of await readdir(directory)) {
  if (/^(en|zh|es|fr|de|ja|ko)\.[a-f0-9]{16}\.json$/.test(name)) await unlink(`${directory}/${name}`);
}
const manifest: Partial<Record<typeof locales[number], string>> = {};
for (const locale of locales) {
  const items = getAllWallpapers(locale).map((item) => ({
    ...item,
    ImageContent: { ...item.ImageContent, Image: {
      ...item.ImageContent?.Image,
      Url: toAbsoluteUrl(item.ImageContent?.Image?.Url),
      Wallpaper: toAbsoluteUrl(item.ImageContent?.Image?.Wallpaper),
    } },
    taxonomy: getImageTaxonomy(item),
  }));
  const json = JSON.stringify(items);
  const hash = createHash("sha256").update(json).digest("hex").slice(0, 16);
  const name = `${locale}.${hash}.json`;
  await writeFile(`${directory}/${name}`, json);
  manifest[locale] = `/detail-index/${name}`;
}
await writeFile("db/detail-index-manifest.json", JSON.stringify(manifest));
console.log("Generated static detail navigation indexes for all languages.");
