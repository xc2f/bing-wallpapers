"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PreserveScrollLink from "@/components/preserve-scroll-link";
import type { Dictionary } from "@/lib/i18n";

const WATERFALL_META_STORAGE_KEY = "waterfall-show-meta";
const SCROLL_STORAGE_PREFIX = "scroll-position:";
const SCROLL_ANCHOR_PREFIX = "scroll-anchor:";
const SCROLL_ANCHOR_SSD_PREFIX = "scroll-anchor-ssd:";
const SCROLL_ANCHOR_OFFSET_PREFIX = "scroll-anchor-offset:";
const INITIAL_BATCH_SIZE = 24;
const LOAD_MORE_BATCH_SIZE = 16;

interface WaterfallGalleryProps {
  allowStoredPreference: boolean;
  dictionary: Dictionary;
  initialShowMeta: boolean;
  storageKey: string;
  items: {
    ssd: string;
    fullDate?: string;
    title: string;
    description?: string;
    previewUrl: string;
    detailHref: string;
  }[];
}

const imageOnlyHeights = [
  264,
  332,
  388,
  300,
  436,
  348,
  404,
  284,
] as const;

function estimateMetaHeight(item: WaterfallGalleryProps["items"][number]) {
  const titleLines = Math.max(1, Math.ceil(item.title.length / 26));
  const description = item.description ?? "";
  const descriptionLines = Math.max(2, Math.min(7, Math.ceil(description.length / 92)));
  return 260 + titleLines * 28 + descriptionLines * 24;
}

function getColumnCount(width: number) {
  if (width >= 1536) return 4;
  if (width >= 1280) return 3;
  if (width >= 640) return 2;
  return 1;
}

function getInitialShowMetaPreference(
  initialShowMeta: boolean,
  allowStoredPreference: boolean
) {
  if (typeof window === "undefined" || !allowStoredPreference) {
    return initialShowMeta;
  }

  const savedValue = window.localStorage.getItem(WATERFALL_META_STORAGE_KEY);

  if (savedValue === "false") {
    return false;
  }

  if (savedValue === "true") {
    return true;
  }

  return initialShowMeta;
}

function getSavedAnchorIndex(
  storageKey: string,
  items: WaterfallGalleryProps["items"]
) {
  if (typeof window === "undefined") {
    return 0;
  }

  const fallbackKey = storageKey.split("?")[0];
  const savedAnchorSsd =
    window.sessionStorage.getItem(`${SCROLL_ANCHOR_SSD_PREFIX}${storageKey}`) ??
    window.sessionStorage.getItem(`${SCROLL_ANCHOR_SSD_PREFIX}${fallbackKey}`) ??
    "";

  if (savedAnchorSsd) {
    return items.findIndex((item) => item.ssd === savedAnchorSsd) + 1;
  }

  return Number(
    window.sessionStorage.getItem(`${SCROLL_ANCHOR_PREFIX}${storageKey}`) ??
      window.sessionStorage.getItem(`${SCROLL_ANCHOR_PREFIX}${fallbackKey}`) ??
      "0"
  );
}

export default function WaterfallGallery({
  allowStoredPreference,
  dictionary,
  initialShowMeta,
  storageKey,
  items,
}: WaterfallGalleryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showMeta, setShowMeta] = useState(initialShowMeta);
  const [columnCount, setColumnCount] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const hasRestoredAnchorRef = useRef(false);
  const hasMountedRef = useRef(false);
  const fallbackStorageKey = storageKey.split("?")[0];
  const hasMetaPayload = useMemo(
    () => items.some((item) => Boolean(item.fullDate || item.description)),
    [items]
  );
  const detailSearch = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "waterfall");
    const nextSearch = params.toString();
    return nextSearch ? `?${nextSearch}` : "";
  }, [searchParams]);

  function createDetailHref(detailHref: string) {
    return `${detailHref}${detailSearch}`;
  }

  function clearStoredRestoration() {
    window.sessionStorage.removeItem(`${SCROLL_STORAGE_PREFIX}${storageKey}`);
    window.sessionStorage.removeItem(`${SCROLL_STORAGE_PREFIX}${fallbackStorageKey}`);
    window.sessionStorage.removeItem(`${SCROLL_ANCHOR_PREFIX}${storageKey}`);
    window.sessionStorage.removeItem(`${SCROLL_ANCHOR_PREFIX}${fallbackStorageKey}`);
    window.sessionStorage.removeItem(`${SCROLL_ANCHOR_SSD_PREFIX}${storageKey}`);
    window.sessionStorage.removeItem(`${SCROLL_ANCHOR_SSD_PREFIX}${fallbackStorageKey}`);
    window.sessionStorage.removeItem(`${SCROLL_ANCHOR_OFFSET_PREFIX}${storageKey}`);
    window.sessionStorage.removeItem(`${SCROLL_ANCHOR_OFFSET_PREFIX}${fallbackStorageKey}`);
  }

  function handleToggleMode() {
    clearStoredRestoration();
    hasRestoredAnchorRef.current = true;
    setShowMeta((current) => !current);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function handleSelectMode(nextShowMeta: boolean) {
    if (nextShowMeta === showMeta) {
      return;
    }

    handleToggleMode();
  }

  function handleToggleDescription(ssd: string) {
    setExpandedDescriptions((current) => ({
      ...current,
      [ssd]: !current[ssd],
    }));
  }

  function handleImageLoad(ssd: string) {
    setLoadedImages((current) => {
      if (current[ssd]) {
        return current;
      }

      return {
        ...current,
        [ssd]: true,
      };
    });
  }

  useLayoutEffect(() => {
    function updateColumns() {
      setColumnCount(getColumnCount(window.innerWidth));
    }

    const nextShowMeta = getInitialShowMetaPreference(
      initialShowMeta,
      allowStoredPreference
    );
    const savedAnchorIndex = getSavedAnchorIndex(storageKey, items);
    const nextVisibleCount = savedAnchorIndex
      ? Math.min(
          Math.max(INITIAL_BATCH_SIZE, savedAnchorIndex + LOAD_MORE_BATCH_SIZE),
          items.length
        )
      : INITIAL_BATCH_SIZE;

    setShowMeta(nextShowMeta);
    setVisibleCount(nextVisibleCount);
    updateColumns();
    setIsReady(true);
    window.addEventListener("resize", updateColumns);

    return () => window.removeEventListener("resize", updateColumns);
  }, [allowStoredPreference, initialShowMeta, items, storageKey]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(
      WATERFALL_META_STORAGE_KEY,
      showMeta ? "true" : "false"
    );
  }, [isReady, showMeta]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (showMeta) {
      params.set("mode", "meta");
    } else {
      params.set("mode", "images");
    }

    const nextSearch = params.toString();
    const nextHref = nextSearch ? `${pathname}?${nextSearch}` : pathname;
    const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    if (nextHref !== currentHref) {
      router.replace(nextHref, { scroll: false });
    }
  }, [isReady, pathname, router, searchParams, showMeta]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    setVisibleCount(INITIAL_BATCH_SIZE);
  }, [showMeta]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const savedAnchorIndex = getSavedAnchorIndex(storageKey, items);

    if (!savedAnchorIndex || Number.isNaN(savedAnchorIndex)) {
      return;
    }

    setVisibleCount((current) =>
      Math.min(
        Math.max(current, savedAnchorIndex + LOAD_MORE_BATCH_SIZE),
        items.length
      )
    );
  }, [isReady, items, items.length, storageKey]);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!isReady || !node || visibleCount >= items.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }

        setVisibleCount((current) =>
          Math.min(current + LOAD_MORE_BATCH_SIZE, items.length)
        );
      },
      {
        rootMargin: "1200px 0px",
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isReady, items.length, visibleCount]);

  const gridColumnsClass =
    columnCount === 4
      ? "grid-cols-4"
      : columnCount === 3
        ? "grid-cols-3"
        : columnCount === 2
          ? "grid-cols-2"
          : "grid-cols-1";
  const imageSizes =
    columnCount === 4
      ? "(min-width: 1536px) 24vw, (min-width: 1280px) 32vw, (min-width: 640px) 48vw, 96vw"
      : columnCount === 3
        ? "(min-width: 1280px) 32vw, (min-width: 640px) 48vw, 96vw"
        : columnCount === 2
          ? "(min-width: 640px) 48vw, 96vw"
          : "96vw";
  const shouldRenderMeta = showMeta && hasMetaPayload;
  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );
  const groupedItems = useMemo(() => {
    const columns = Array.from({ length: columnCount }, () => [] as typeof items);
    const columnHeights = Array.from({ length: columnCount }, () => 0);

    visibleItems.forEach((item, index) => {
      const estimatedHeight = shouldRenderMeta
        ? estimateMetaHeight(item)
        : imageOnlyHeights[index % imageOnlyHeights.length];
      const targetColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

      columns[targetColumnIndex].push(item);
      columnHeights[targetColumnIndex] += estimatedHeight;
    });

    return columns;
  }, [columnCount, shouldRenderMeta, visibleItems]);
  const visibleItemIndexMap = useMemo(
    () =>
      new Map(visibleItems.map((item, index) => [item.ssd, index + 1])),
    [visibleItems]
  );
  const visibleItemOrderMap = useMemo(
    () => new Map(visibleItems.map((item, index) => [item.ssd, index])),
    [visibleItems]
  );

  useEffect(() => {
    const root = sectionRef.current;

    if (!isReady || !root) {
      return;
    }

    const cards = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal-card='true']")
    );

    if (!cards.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.setAttribute("data-revealed", "true");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "240px 0px 12% 0px",
        threshold: 0.01,
      }
    );

    cards.forEach((card) => {
      if (card.getAttribute("data-revealed") === "true") {
        return;
      }

      observer.observe(card);
    });

    return () => observer.disconnect();
  }, [groupedItems, isReady]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (hasRestoredAnchorRef.current) {
      return;
    }

    const fallbackKey = storageKey.split("?")[0];
    const anchorStorageKey = window.sessionStorage.getItem(
      `${SCROLL_ANCHOR_SSD_PREFIX}${storageKey}`
    ) || window.sessionStorage.getItem(`${SCROLL_ANCHOR_PREFIX}${storageKey}`)
      ? storageKey
      : fallbackKey;
    const savedAnchorSsd =
      window.sessionStorage.getItem(`${SCROLL_ANCHOR_SSD_PREFIX}${anchorStorageKey}`) ??
      "";
    const savedAnchorOffset = Number(
      window.sessionStorage.getItem(`${SCROLL_ANCHOR_OFFSET_PREFIX}${anchorStorageKey}`) ??
        window.sessionStorage.getItem(`${SCROLL_ANCHOR_OFFSET_PREFIX}${fallbackKey}`) ??
        "24"
    );
    const savedAnchorIndex = savedAnchorSsd
      ? visibleItemIndexMap.get(savedAnchorSsd) ?? 0
      : Number(
          window.sessionStorage.getItem(`${SCROLL_ANCHOR_PREFIX}${anchorStorageKey}`) ?? "0"
        );

    if (!savedAnchorIndex || Number.isNaN(savedAnchorIndex)) {
      return;
    }

    const targetSelector = savedAnchorSsd
      ? `[data-waterfall-ssd="${savedAnchorSsd}"]`
      : `[data-waterfall-index="${savedAnchorIndex}"]`;
    const targetElement = document.querySelector<HTMLElement>(targetSelector);

    if (!targetElement) {
      return;
    }

    hasRestoredAnchorRef.current = true;
    window.requestAnimationFrame(() => {
      const offset = Number.isNaN(savedAnchorOffset) ? 24 : savedAnchorOffset;
      const targetTop = targetElement.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, targetTop) });
      window.sessionStorage.removeItem(`${SCROLL_STORAGE_PREFIX}${storageKey}`);
      window.sessionStorage.removeItem(`${SCROLL_STORAGE_PREFIX}${fallbackKey}`);
      window.sessionStorage.removeItem(`${SCROLL_ANCHOR_PREFIX}${storageKey}`);
      window.sessionStorage.removeItem(`${SCROLL_ANCHOR_PREFIX}${fallbackKey}`);
      window.sessionStorage.removeItem(`${SCROLL_ANCHOR_SSD_PREFIX}${storageKey}`);
      window.sessionStorage.removeItem(`${SCROLL_ANCHOR_SSD_PREFIX}${fallbackKey}`);
      window.sessionStorage.removeItem(`${SCROLL_ANCHOR_OFFSET_PREFIX}${storageKey}`);
      window.sessionStorage.removeItem(`${SCROLL_ANCHOR_OFFSET_PREFIX}${fallbackKey}`);
    });
  }, [groupedItems, isReady, storageKey, visibleItemIndexMap]);

  return (
    <section ref={sectionRef} className="flex flex-col gap-6">
      <div className="flex justify-end">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur">
          <button
            type="button"
            onClick={() => handleSelectMode(false)}
            aria-pressed={!showMeta}
            className={`rounded-full px-4 py-2 text-sm transition ${
              !showMeta
                ? "bg-amber-300 text-stone-950 shadow-sm"
                : "text-stone-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {dictionary.waterfallHideMeta}
          </button>
          <button
            type="button"
            onClick={() => handleSelectMode(true)}
            aria-pressed={showMeta}
            className={`rounded-full px-4 py-2 text-sm transition ${
              showMeta
                ? "bg-amber-300 text-stone-950 shadow-sm"
                : "text-stone-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {dictionary.waterfallShowMeta}
          </button>
        </div>
      </div>

      {!isReady ? <div className="min-h-[24rem]" aria-hidden="true" /> : null}

      {isReady && shouldRenderMeta ? (
        <div className={`waterfall-view-stage grid items-start gap-4 ${gridColumnsClass}`}>
          {groupedItems.map((group, columnIndex) => (
            <div key={`meta-column-${columnIndex}`} className="flex flex-col gap-4">
              {group.map((item) => {
                const isExpanded = Boolean(expandedDescriptions[item.ssd]);
                const imageLoaded = Boolean(loadedImages[item.ssd]);
                const description = item.description ?? dictionary.noDescription;
                const visibleIndex = visibleItemOrderMap.get(item.ssd) ?? 0;
                const prioritizeImage = visibleIndex < 12;

                return (
                <article
                  key={item.ssd}
                  data-reveal-card="true"
                  data-revealed="false"
                  data-waterfall-index={visibleItemIndexMap.get(item.ssd)}
                  data-waterfall-ssd={item.ssd}
                  className="waterfall-card-reveal overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/20"
                  style={{
                    contentVisibility: "auto",
                    containIntrinsicSize: "480px",
                    transitionDelay: `${Math.min(
                      visibleIndex % 8,
                      7
                    ) * 26}ms`,
                  }}
                >
                  <PreserveScrollLink
                    href={createDetailHref(item.detailHref)}
                    className="block"
                  >
                    {item.previewUrl ? (
                      <div className="relative aspect-[16/10] min-h-[15rem] overflow-hidden bg-stone-900/80">
                        {!imageLoaded ? (
                          <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(255,255,255,0.03)_45%,rgba(245,158,11,0.06))]" />
                        ) : null}
                        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-20 bg-gradient-to-b from-black/12 to-transparent" />
                        <Image
                          src={item.previewUrl}
                          alt={item.title}
                          width={1920}
                          height={1080}
                          sizes={imageSizes}
                          quality={68}
                          priority={prioritizeImage}
                          loading={prioritizeImage ? "eager" : "lazy"}
                          onLoad={() => handleImageLoad(item.ssd)}
                          className={`h-full w-full object-cover transition duration-500 hover:scale-[1.01] ${
                            imageLoaded ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </div>
                    ) : (
                      <div className="flex min-h-56 items-center justify-center bg-stone-900 px-6 text-sm text-stone-400">
                        {dictionary.noPreviewImage}
                      </div>
                    )}
                  </PreserveScrollLink>

                  <div className="space-y-4 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                      {item.fullDate ?? ""}
                    </p>
                    <h2 className="text-lg font-semibold leading-6 text-white">
                      <PreserveScrollLink
                        href={createDetailHref(item.detailHref)}
                        className="line-clamp-2 text-balance transition hover:text-amber-200"
                      >
                        {item.title}
                      </PreserveScrollLink>
                    </h2>
                    <div className={isExpanded ? "" : "waterfall-description-fade relative"}>
                      <p
                        className={`text-sm leading-6 text-stone-400 ${
                          isExpanded ? "" : "line-clamp-4"
                        }`}
                      >
                        {description}
                      </p>
                    </div>
                    {description.length > 220 ? (
                      <button
                        type="button"
                        onClick={() => handleToggleDescription(item.ssd)}
                        className="text-xs uppercase tracking-[0.22em] text-stone-400 transition hover:text-stone-200"
                      >
                        {isExpanded
                          ? dictionary.waterfallCollapseDescription
                          : dictionary.waterfallExpandDescription}
                      </button>
                    ) : null}
                  </div>
                </article>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}

      {isReady && !shouldRenderMeta ? (
        <div className={`waterfall-view-stage grid items-start gap-2 ${gridColumnsClass}`}>
          {groupedItems.map((group, columnIndex) => (
            <div key={`column-${columnIndex}`} className="flex flex-col gap-2">
              {group.map((item) => {
                const originalIndex = visibleItemOrderMap.get(item.ssd) ?? 0;
                const imageOnlyHeight =
                  imageOnlyHeights[originalIndex % imageOnlyHeights.length];
                const imageOnlyStyle = { height: `${imageOnlyHeight}px` };
                const prioritizeImage = originalIndex < 16;

                return (
                  <article
                    key={item.ssd}
                    data-reveal-card="true"
                    data-revealed="false"
                    data-waterfall-index={visibleItemIndexMap.get(item.ssd)}
                    data-waterfall-ssd={item.ssd}
                    className="waterfall-card-reveal group relative overflow-hidden rounded-[1.15rem] border border-white/5 bg-white/[0.02] shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
                    style={{
                      contentVisibility: "auto",
                      containIntrinsicSize: `${imageOnlyHeight}px`,
                      transitionDelay: `${Math.min(originalIndex % 8, 7) * 22}ms`,
                    }}
                  >
                    <PreserveScrollLink
                      href={createDetailHref(item.detailHref)}
                      className="block overflow-hidden rounded-[1.15rem]"
                    >
                      {item.previewUrl ? (
                        <div className="relative overflow-hidden bg-stone-900/80" style={imageOnlyStyle}>
                          {!loadedImages[item.ssd] ? (
                            <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(255,255,255,0.03)_45%,rgba(245,158,11,0.06))]" />
                          ) : null}
                          <Image
                            src={item.previewUrl}
                            alt={item.title}
                            width={1920}
                            height={1080}
                            sizes={imageSizes}
                            quality={68}
                            priority={prioritizeImage}
                            loading={prioritizeImage ? "eager" : "lazy"}
                            onLoad={() => handleImageLoad(item.ssd)}
                            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] ${
                              loadedImages[item.ssd] ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-center bg-stone-900 px-6 text-sm text-stone-400"
                          style={imageOnlyStyle}
                        >
                          {dictionary.noPreviewImage}
                        </div>
                      )}

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/72 via-black/28 to-transparent px-4 pb-4 pt-12 opacity-100 transition duration-300 sm:opacity-80 sm:group-hover:opacity-100">
                        <p className="line-clamp-2 text-sm font-medium leading-6 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.32)]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-stone-200/72">
                          {item.fullDate ?? item.ssd}
                        </p>
                      </div>
                    </PreserveScrollLink>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}

      {isReady && visibleCount < items.length ? (
        <div ref={sentinelRef} className="h-12" aria-hidden="true" />
      ) : null}
    </section>
  );
}
