"use client";

import Image from "next/image";
import PreserveScrollLink from "@/components/preserve-scroll-link";
import ScrollRestorer from "@/components/scroll-restorer";
import SmartBackButton from "@/components/smart-back-button";
import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import FavoritesBackupControls from "@/components/favorites-backup-controls";
import FavoriteIcon from "@/components/favorite-icon";
import { favoriteLabels } from "@/lib/favorite-labels";
import { favoriteKey, type FavoriteWallpaper } from "@/lib/favorite-wallpaper";
import { setFavorite, useFavorites } from "@/lib/favorites";
import type { FavoritesBackupSite } from "@/lib/favorites-backup";
import { formatArchiveDate, getDictionary, localizePath, type Locale } from "@/lib/i18n";
import { taxonomyUiLabel } from "@/lib/taxonomy-ui-labels";

export default function FavoritesGallery({ locale, site }: { locale: Locale; site: FavoritesBackupSite }) {
  const { favorites, cards, ready, available } = useFavorites({ preferredLocale: locale });
  const [failed, setFailed] = useState(false);
  const pendingRemovals = useRef(new Set<string>());
  const grid = useRef<HTMLUListElement>(null);
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const nextFocusIndex = useRef<number | null>(null);
  const previousPositions = useRef<Map<Element, DOMRect> | null>(null);
  const positionAnimations = useRef(new WeakMap<Element, Animation>());
  const labels = favoriteLabels[locale];
  const dictionary = getDictionary(locale);

  useLayoutEffect(() => {
    const index = nextFocusIndex.current;
    if (index === null || !ready) return;
    nextFocusIndex.current = null;
    if (document.activeElement !== document.body) return;

    const items = grid.current?.children;
    const next = items?.item(Math.min(index, items.length - 1))?.querySelector("button");
    (next ?? importButtonRef.current)?.focus({ preventScroll: true });
  }, [cards.length, ready]);

  useLayoutEffect(() => {
    const positions = previousPositions.current;
    previousPositions.current = null;
    if (!positions || !grid.current || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;

    const remaining = Array.from(grid.current.children);
    for (const card of remaining) positionAnimations.current.get(card)?.cancel();

    for (const card of remaining) {
      const previous = positions.get(card);
      if (!previous) continue;
      const current = card.getBoundingClientRect();
      const x = previous.left - current.left;
      const y = previous.top - current.top;
      if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) continue;

      positionAnimations.current.set(card, card.animate(
        [{ translate: `${x}px ${y}px` }, { translate: "0px 0px" }],
        { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      ));
    }
  }, [cards]);

  async function removeFavorite(event: MouseEvent<HTMLButtonElement>, wallpaper: FavoriteWallpaper) {
    const key = favoriteKey(wallpaper);
    if (pendingRemovals.current.has(key)) return;
    const button = event.currentTarget;
    const card = button.closest("li");
    function commitRemoval() {
      const index = grid.current && card ? Array.from(grid.current.children).indexOf(card) : -1;
      const restoreFocus = index >= 0 && document.activeElement === button;
      if (restoreFocus) nextFocusIndex.current = index;
      const success = setFavorite(wallpaper, false);
      if (!success && restoreFocus) nextFocusIndex.current = null;
      setFailed(!success);
      return success;
    }

    if (!card || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      commitRemoval();
      return;
    }

    pendingRemovals.current.add(key);
    const animation = card.animate(
      [
        { opacity: 1, transform: "none", easing: "ease-out" },
        { opacity: 0.75, transform: "translateY(1px) scale(0.99)", offset: 0.36, easing: "ease-in" },
        { opacity: 0, transform: "translateY(5px) scale(0.975)" },
      ],
      { duration: 180, fill: "forwards" },
    );
    // The removal still applies if navigation interrupts the animation.
    await animation.finished.catch(() => {});
    // Record the current visual positions before updating the grid.
    const positions = grid.current && new Map(
      Array.from(grid.current.children, (item) => [item, item.getBoundingClientRect()] as const),
    );
    previousPositions.current ??= positions;
    if (!commitRemoval()) {
      if (previousPositions.current === positions) previousPositions.current = null;
      animation.cancel();
    }
    pendingRemovals.current.delete(key);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      <header className="space-y-3">
        <SmartBackButton fallbackHref={localizePath(locale)} label={dictionary.detailBack} scroll />
        <div className="flex flex-col items-start gap-3 md:flex-row md:justify-between md:gap-6">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="min-w-0 break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl">{labels.page}</h1>
              {ready && available && cards.length > 0 && (
                <span className="whitespace-nowrap text-sm tabular-nums text-stone-400">
                  {taxonomyUiLabel(cards.length === 1 ? "galleryCountOne" : "galleryCount", locale)
                    .replace("{count}", cards.length.toLocaleString(locale))}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-stone-400">{labels.localStorageNote}</p>
          </div>
          {available && <FavoritesBackupControls locale={locale} favorites={favorites} ready={ready} site={site} importButtonRef={importButtonRef} />}
        </div>
      </header>
      {failed && <p role="status" className="text-sm text-stone-400">{labels.unavailable}</p>}
      {!ready || !available ? (
        <p role="status" className="text-sm text-stone-400">
          {ready ? labels.unavailable : dictionary.waterfallLoading}
        </p>
      ) : cards.length ? (
        <>
          <ScrollRestorer storageKey={localizePath(locale, "/favorites")} />
          <ul ref={grid} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ original, wallpaper }) => (
              <li key={favoriteKey(original)} className="rounded-[1.15rem] bg-[rgb(var(--theme-overlay-rgb)/0.04)]">
                <PreserveScrollLink href={localizePath(wallpaper.locale, `/wallpaper/${wallpaper.ssd}?favoritesLocale=${locale}`)}
                  className="group block rounded-t-[1.15rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--theme-accent-text-rgb))]">
                  {wallpaper.previewUrl && (
                    <div className="relative aspect-video overflow-hidden rounded-t-[1.15rem]">
                      <Image src={wallpaper.previewUrl} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" referrerPolicy="no-referrer" className="object-cover" />
                    </div>
                  )}
                  <h2 className="break-words px-4 pt-3 font-medium group-hover:underline group-focus-visible:underline">{wallpaper.title}</h2>
                </PreserveScrollLink>
                <div className="flex items-center justify-between gap-2 px-4 pb-2 text-xs tabular-nums text-stone-400">
                  <span>{formatArchiveDate(locale, wallpaper.ssd)}</span>
                  <button type="button" aria-label={`${labels.remove} · ${wallpaper.title}`} title={labels.remove}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[rgb(var(--theme-accent-text-rgb))] transition hover:bg-[rgb(var(--theme-overlay-rgb)/0.08)] focus-visible:outline focus-visible:outline-2"
                    onClick={(event) => void removeFavorite(event, original)}>
                    <FavoriteIcon saved />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div role="status" className="rounded-[1.15rem] bg-[rgb(var(--theme-overlay-rgb)/0.04)] px-4 py-5 sm:px-5">
          <p className="text-sm font-semibold text-stone-100">{labels.emptyTitle}</p>
          <p className="mt-1 text-sm leading-relaxed text-stone-400">{labels.empty}</p>
        </div>
      )}
    </div>
  );
}
