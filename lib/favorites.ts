"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import detailIndexManifest from "@/db/detail-index-manifest.json";
import type { DetailIndexItem } from "@/lib/detail-browse";
import {
  favoriteKey, identifyFavorite, indexFavoriteArchive, isSameFavorite, localizeFavorite,
  type FavoriteArchive, type FavoriteWallpaper,
} from "@/lib/favorite-wallpaper";
import { isFavoriteWallpaper } from "@/lib/favorites-backup";
import { isValidLocale, locales, type Locale } from "@/lib/i18n";

const archives = new Map<Locale, FavoriteArchive>();
const archiveRequests = new Map<Locale, Promise<void>>();

function loadArchive(locale: Locale) {
  if (archives.has(locale)) return Promise.resolve();
  let request = archiveRequests.get(locale);
  if (!request) {
    request = fetch(detailIndexManifest[locale].navigation).then(async (response) => {
      if (!response.ok) throw new Error("Could not load wallpaper index");
      archives.set(locale, indexFavoriteArchive(await response.json() as DetailIndexItem[]));
    }).finally(() => archiveRequests.delete(locale));
    archiveRequests.set(locale, request);
  }
  return request;
}

function resolveIdentity(wallpaper: FavoriteWallpaper) {
  return identifyFavorite(wallpaper, archives.get(wallpaper.locale));
}

const storageKey = "bing-wallpapers:favorites";
const changeEvent = "bing-wallpapers:favorites-change";

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, onChange);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(storageKey) ?? "[]";
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  return undefined;
}

function readFavorites(value: string | null | undefined): FavoriteWallpaper[] {
  if (!value) return [];
  try {
    const entries: unknown = JSON.parse(value);
    if (!Array.isArray(entries)) return [];
    return entries.filter(isFavoriteWallpaper);
  } catch {
    return [];
  }
}

function uniqueFavorites(entries: FavoriteWallpaper[]) {
  const seen = new Set<string>();
  return entries.map(resolveIdentity).filter((wallpaper) => {
    const key = favoriteKey(wallpaper);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function useFavorites({ preferredLocale, lookupLocale }: {
  preferredLocale?: Locale;
  lookupLocale?: Locale;
} = {}) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const entries = useMemo(() => readFavorites(snapshot), [snapshot]);
  const needed = new Set(entries.filter(({ imageId }) => !imageId).map(({ locale }) => locale));
  if (lookupLocale) needed.add(lookupLocale);
  if (preferredLocale && entries.some(({ locale }) => locale !== preferredLocale)) needed.add(preferredLocale);
  const archiveKey = [...needed].sort().join(",");
  const [settledKey, setSettledKey] = useState("");
  useEffect(() => {
    if (!archiveKey) return;
    let active = true;
    void Promise.allSettled(archiveKey.split(",").filter(isValidLocale).map(loadArchive)).then(() => {
      if (active) setSettledKey(archiveKey);
    });
    return () => { active = false; };
  }, [archiveKey]);

  const favorites = uniqueFavorites(entries);
  const cards = preferredLocale
    ? favorites.map((original) => ({
        original,
        wallpaper: localizeFavorite(original, preferredLocale, archives.get(preferredLocale)),
      }))
    : [];
  return {
    favorites,
    cards,
    ready: snapshot !== undefined && (!archiveKey || settledKey === archiveKey || [...needed].every((locale) => archives.has(locale))),
    available: snapshot !== null,
  };
}

export function isFavorite(favorites: FavoriteWallpaper[], wallpaper: FavoriteWallpaper) {
  const identified = resolveIdentity(wallpaper);
  return favorites.some((entry) => isSameFavorite(entry, identified));
}

export function setFavorite(wallpaper: FavoriteWallpaper, saved: boolean) {
  try {
    const entries = uniqueFavorites(readFavorites(window.localStorage.getItem(storageKey)));
    const identified = resolveIdentity(wallpaper);
    const remaining = entries.filter((entry) => !isSameFavorite(entry, identified));
    window.localStorage.setItem(storageKey, JSON.stringify(saved ? [identified, ...remaining] : remaining));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(changeEvent));
  return true;
}

export async function importFavorites(incoming: FavoriteWallpaper[]) {
  const current = readFavorites(getSnapshot());
  const needed = new Set([
    ...incoming.map(({ locale }) => locale),
    ...current.filter(({ imageId }) => !imageId).map(({ locale }) => locale),
  ]);
  await Promise.all([...needed].map(loadArchive));

  if (incoming.some(({ imageId, locale }) => imageId && !archives.get(locale)?.byImageId.has(imageId))) {
    await Promise.all(locales.map(loadArchive));
  }

  // Read again after loading the indexes so changes made during import are included.
  const existing = uniqueFavorites(readFavorites(window.localStorage.getItem(storageKey)));
  const added: FavoriteWallpaper[] = [];
  const seen = new Set(existing.map(favoriteKey));
  for (const wallpaper of incoming) {
    let locale = wallpaper.locale;
    const archive = archives.get(locale);
    let match = wallpaper.imageId
      ? archive?.byImageId.get(wallpaper.imageId)
      : archive?.byPreviewUrl.get(wallpaper.previewUrl);
    if (!match && wallpaper.imageId) {
      for (const alternate of locales) {
        match = archives.get(alternate)?.byImageId.get(wallpaper.imageId);
        if (match) {
          locale = alternate;
          break;
        }
      }
    }
    if (!match) continue;

    const entry: FavoriteWallpaper = {
      locale,
      ssd: match.Ssd,
      imageId: match.imageId,
      title: match.ImageContent?.Title ?? match.Ssd,
      previewUrl: match.ImageContent?.Image?.Url ?? "",
    };
    const key = favoriteKey(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    added.push(entry);
  }

  if (added.length) {
    window.localStorage.setItem(storageKey, JSON.stringify([...added, ...existing]));
    window.dispatchEvent(new Event(changeEvent));
  }
  return { added: added.length, skipped: incoming.length - added.length };
}
