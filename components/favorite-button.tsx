"use client";

import { useRef, useState, type MouseEvent } from "react";
import FavoriteIcon from "@/components/favorite-icon";
import { favoriteLabels } from "@/lib/favorite-labels";
import { isFavorite, setFavorite, useFavorites } from "@/lib/favorites";
import type { FavoriteWallpaper } from "@/lib/favorite-wallpaper";
import { useWallpaperShortcut } from "@/lib/wallpaper-shortcuts";
import type { Locale } from "@/lib/i18n";

export default function FavoriteButton({ wallpaper, locale, controlClass }: {
  wallpaper: Omit<FavoriteWallpaper, "locale">;
  locale: Locale;
  controlClass?: string;
}) {
  const { favorites, ready, available } = useFavorites({ lookupLocale: wallpaper.imageId ? undefined : locale });
  const [failed, setFailed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const entry = { ...wallpaper, locale };
  const saved = isFavorite(favorites, entry);
  const labels = favoriteLabels[locale];

  useWallpaperShortcut("f", buttonRef);

  function toggleFavorite(event: MouseEvent<HTMLButtonElement>) {
    const success = setFavorite(entry, !saved);
    setFailed(!success);
    if (!success || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;

    const icon = event.currentTarget.querySelector("svg");
    if (!icon) return;
    const start = getComputedStyle(icon).transform;
    for (const animation of icon.getAnimations()) animation.cancel();
    icon.animate(
      saved
        ? [
            { transform: start, easing: "ease-out" },
            { transform: "translateY(1px) scale(0.84)", offset: 0.34, easing: "ease-out" },
            { transform: "scale(1.03)", offset: 0.74, easing: "ease-in-out" },
            { transform: "none" },
          ]
        : [
            { transform: start, easing: "ease-out" },
            { transform: "translateY(1px) scale(0.92)", offset: 0.16, easing: "ease-out" },
            { transform: "translateY(-2px) rotate(-7deg) scale(1.2)", offset: 0.45, easing: "ease-in-out" },
            { transform: "translateY(0.5px) rotate(2deg) scale(0.98)", offset: 0.78, easing: "ease-out" },
            { transform: "none" },
          ],
      { duration: saved ? 200 : 300 },
    );
  }

  return (
    <div className={controlClass ? "relative" : "min-w-0"}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={labels.toggle}
        aria-keyshortcuts="F"
        aria-pressed={saved}
        title={`${saved ? labels.remove : labels.toggle} (F)`}
        disabled={!ready || !available}
        onClick={toggleFavorite}
        className={controlClass ?? "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[rgb(var(--theme-overlay-rgb)/0.06)] px-3 py-2 text-sm font-medium transition hover:bg-[rgb(var(--theme-overlay-rgb)/0.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--theme-accent-text-rgb))] disabled:opacity-40 aria-pressed:text-[rgb(var(--theme-accent-text-rgb))]"}
      >
        <FavoriteIcon saved={saved} />
        {!controlClass && labels.toggle}
      </button>
      {(failed || !available) && (
        <p role="status" className={controlClass ? "absolute bottom-full right-0 mb-2 w-max max-w-52 rounded-lg bg-black/85 px-3 py-2 text-xs text-[#f5f5f4]" : "mt-2 text-xs text-stone-400"}>
          {labels.unavailable}
        </p>
      )}
    </div>
  );
}
