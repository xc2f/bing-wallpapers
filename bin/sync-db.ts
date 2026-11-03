import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import "dotenv/config";
import { defaultLocale, locales } from "../lib/i18n";

interface RemoteFile {
  label: string;
  outputPath: string;
  url?: string;
}

const tagsPath = resolve("db/image_tags.json");
const inferredTagsUrl = process.env.DB_SYNC_JSON_URL?.replace(/media_contents\.json(?=[?#]|$)/, "image_tags.json");
const tagsUrl = process.env.DB_SYNC_TAGS_URL || (
  inferredTagsUrl !== process.env.DB_SYNC_JSON_URL ? inferredTagsUrl : undefined
);

const remoteFiles: RemoteFile[] = [
  {
    label: "media_contents.json",
    outputPath: resolve("db/media_contents.json"),
    url: process.env.DB_SYNC_JSON_URL,
  },
  { label: "image_tags.json", outputPath: tagsPath, url: tagsUrl },
];

const fallbackJsonPath = resolve("db/media_contents.json");
const fallbackJsonContent = JSON.stringify({
  schemaVersion: 2,
  defaultLocale,
  fallbackLocale: defaultLocale,
  mediaContents: Object.fromEntries(locales.map((locale) => [locale, []])),
}, null, 2);

function getHeaders() {
  const headers = new Headers();
  headers.set("Accept", "application/vnd.github.raw+json");
  headers.set("User-Agent", "bing-wallpapers-db-sync");
  headers.set("X-GitHub-Api-Version", "2022-11-28");

  if (process.env.DB_SYNC_BEARER_TOKEN) {
    headers.set("Authorization", `Bearer ${process.env.DB_SYNC_BEARER_TOKEN}`);
  }

  return headers;
}

async function downloadFile(file: RemoteFile) {
  if (!file.url) {
    return false;
  }

  const response = await fetch(file.url, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${file.label}: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  if (file.label === "image_tags.json") {
    const tags = JSON.parse(Buffer.from(arrayBuffer).toString("utf8"));
    if (tags.schemaVersion !== 1 || !tags.images || typeof tags.images !== "object" || Array.isArray(tags.images) ||
        !Object.values(tags.images).every((entry) => {
          const value = entry as { category?: unknown; tags?: unknown } | null;
          return value && typeof value.category === "string" && Array.isArray(value.tags) && value.tags.every((tag) => typeof tag === "string");
        })) {
      throw new Error("Invalid image_tags.json: expected schemaVersion 1 and image category/tag records.");
    }
  }
  await mkdir(dirname(file.outputPath), { recursive: true });
  await writeFile(file.outputPath, Buffer.from(arrayBuffer));

  console.log(`Synced ${file.label} -> ${file.outputPath}`);
  return true;
}

async function ensureFallbackDbFile() {
  try {
    await access(fallbackJsonPath);
    console.log(`Using existing DB file -> ${fallbackJsonPath}`);
    return;
  } catch {
    // Fall through and create the placeholder file when it does not exist.
  }

  await mkdir(dirname(fallbackJsonPath), { recursive: true });
  await writeFile(fallbackJsonPath, `${fallbackJsonContent}\n`);
  console.log(`Created fallback DB file -> ${fallbackJsonPath}`);
}

async function main() {
  const enabled = process.env.DB_SYNC_ENABLED === "true";

  if (!enabled) {
    console.log("DB sync skipped because DB_SYNC_ENABLED is not true.");
    await ensureFallbackDbFile();
    try {
      await access(tagsPath);
    } catch {
      await writeFile(tagsPath, `${JSON.stringify({ schemaVersion: 1, taxonomyVersion: 1, images: {} }, null, 2)}\n`);
      console.log(`Created fallback tags file -> ${tagsPath}`);
    }
    return;
  }

  if (!process.env.DB_SYNC_JSON_URL) {
    throw new Error("DB_SYNC_JSON_URL is required when DB_SYNC_ENABLED=true.");
  }

  if (!tagsUrl) {
    throw new Error("DB_SYNC_TAGS_URL is required when the tags URL cannot be inferred from DB_SYNC_JSON_URL.");
  }

  const results = await Promise.all(remoteFiles.map((file) => downloadFile(file)));
  const syncedCount = results.filter(Boolean).length;

  console.log(`DB sync completed. Downloaded ${syncedCount} file(s).`);
}

main().catch((error) => {
  console.error("DB sync failed:", error);
  process.exit(1);
});
