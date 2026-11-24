"use client";

import { useRef, useState, type ChangeEvent, type Ref } from "react";
import { favoriteBackupLabels } from "@/lib/favorite-labels";
import type { FavoriteWallpaper } from "@/lib/favorite-wallpaper";
import { importFavorites } from "@/lib/favorites";
import { decodeFavoritesBackup, encodeFavoritesBackup, type FavoritesBackupSite } from "@/lib/favorites-backup";
import type { Locale } from "@/lib/i18n";

const buttonClass = "theme-button-hover inline-flex min-h-11 items-center rounded-full border border-[rgb(var(--theme-border-rgb)/0.1)] px-3 py-1.5 text-sm font-medium text-stone-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--theme-accent-ring-rgb))] disabled:opacity-50 sm:min-h-9";

export default function FavoritesBackupControls({ locale, favorites, ready, site, importButtonRef }: {
  locale: Locale;
  favorites: FavoriteWallpaper[];
  ready: boolean;
  site: FavoritesBackupSite;
  importButtonRef?: Ref<HTMLButtonElement>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const labels = favoriteBackupLabels[locale];

  function exportBackup() {
    const blob = new Blob([encodeFavoritesBackup(favorites, site)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bing-wallpapers-favorites.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setImporting(true);
    setMessage("");
    try {
      const backup = decodeFavoritesBackup(await file.text());
      if (!backup) {
        setMessage(labels.invalid);
        return;
      }
      const result = await importFavorites(backup.favorites);
      setMessage(labels.result(result.added, result.skipped + backup.skipped));
    } catch {
      setMessage(labels.failed);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="ml-auto max-w-full space-y-2 text-right md:max-w-[50%] md:shrink-0 md:pt-3">
      <div className="flex flex-wrap justify-end gap-2">
        <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={importBackup} />
        <button ref={importButtonRef} type="button" className={buttonClass} disabled={!ready || importing} onClick={() => fileInput.current?.click()}>
          {labels.import}
        </button>
        {favorites.length > 0 && (
          <button type="button" className={buttonClass} disabled={!ready || importing} onClick={exportBackup}>
            {labels.export}
          </button>
        )}
      </div>
      <p role="status" className={importing || message ? "text-sm text-stone-400" : "sr-only"}>
        {importing ? labels.importing : message}
      </p>
    </div>
  );
}
