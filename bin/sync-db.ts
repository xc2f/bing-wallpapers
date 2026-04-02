import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import "dotenv/config";

interface RemoteFile {
  label: string;
  outputPath: string;
  url?: string;
}

const remoteFiles: RemoteFile[] = [
  {
    label: "media_contents.json",
    outputPath: resolve("db/media_contents.json"),
    url: process.env.DB_SYNC_JSON_URL,
  },
];

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
  await mkdir(dirname(file.outputPath), { recursive: true });
  await writeFile(file.outputPath, Buffer.from(arrayBuffer));

  console.log(`Synced ${file.label} -> ${file.outputPath}`);
  return true;
}

async function main() {
  const enabled = process.env.DB_SYNC_ENABLED === "true";

  if (!enabled) {
    console.log("DB sync skipped because DB_SYNC_ENABLED is not true.");
    return;
  }

  if (!process.env.DB_SYNC_JSON_URL) {
    throw new Error("DB_SYNC_JSON_URL is required when DB_SYNC_ENABLED=true.");
  }

  const results = await Promise.all(remoteFiles.map((file) => downloadFile(file)));
  const syncedCount = results.filter(Boolean).length;

  console.log(`DB sync completed. Downloaded ${syncedCount} file(s).`);
}

main().catch((error) => {
  console.error("DB sync failed:", error);
  process.exit(1);
});
