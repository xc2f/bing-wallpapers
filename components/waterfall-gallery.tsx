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
const INITIAL_BATCH_SIZE = 48;
const LOAD_MORE_BATCH_SIZE = 24;

interface WaterfallGalleryProps {
  allowStoredPreference: boolean;
  dictionary: Dictionary;
  initialShowMeta: boolean;
  storageKey: string;
  items: {
    ssd: string;
    fullDate: string;
    title: string;
    description: string;
    previewUrl: string;
    detailHref: string;
  }[];
}

const imageOnlyHeights = [
  272,
  344,
  416,
  308,
  492,
  356,
  448,
  288,
] as const;

function estimateMetaHeight(item: WaterfallGalleryProps["items"][number]) {
  const titleLines = Math.max(1, Math.ceil(item.title.length / 26));
  const descriptionLines = Math.max(2, Math.min(7, Math.ceil(item.description.length / 92)));
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
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasRestoredAnchorRef = useRef(false);
  const hasMountedRef = useRef(false);
  const fallbackStorageKey = storageKey.split("?")[0];

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
  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );
  const groupedItems = useMemo(() => {
    const columns = Array.from({ length: columnCount }, () => [] as typeof items);
    const columnHeights = Array.from({ length: columnCount }, () => 0);

    visibleItems.forEach((item, index) => {
      const estimatedHeight = showMeta
        ? estimateMetaHeight(item)
        : imageOnlyHeights[index % imageOnlyHeights.length];
      const targetColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

      columns[targetColumnIndex].push(item);
      columnHeights[targetColumnIndex] += estimatedHeight;
    });

    return columns;
  }, [columnCount, showMeta, visibleItems]);
  const visibleItemIndexMap = useMemo(
    () =>
      new Map(visibleItems.map((item, index) => [item.ssd, index + 1])),
    [visibleItems]
  );

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
    <section className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleToggleMode}
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10"
        >
          {showMeta ? dictionary.waterfallHideMeta : dictionary.waterfallShowMeta}
        </button>
      </div>

      {!isReady ? <div className="min-h-[24rem]" aria-hidden="true" /> : null}

      {isReady && showMeta ? (
        <div className={`grid items-start gap-6 ${gridColumnsClass}`}>
          {groupedItems.map((group, columnIndex) => (
            <div key={`meta-column-${columnIndex}`} className="flex flex-col gap-6">
              {group.map((item) => (
                <article
                  key={item.ssd}
                  data-waterfall-index={visibleItemIndexMap.get(item.ssd)}
                  data-waterfall-ssd={item.ssd}
                  className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/20"
                >
                  <PreserveScrollLink
                    href={item.detailHref}
                    className="block"
                  >
                    {item.previewUrl ? (
                      <Image
                        src={item.previewUrl}
                        alt={item.title}
                        width={1920}
                        height={1080}
                        className="h-auto w-full object-cover transition duration-300 hover:scale-[1.01]"
                      />
                    ) : (
                      <div className="flex min-h-56 items-center justify-center bg-stone-900 px-6 text-sm text-stone-400">
                        {dictionary.noPreviewImage}
                      </div>
                    )}
                  </PreserveScrollLink>

                  <div className="space-y-3 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                      {item.fullDate}
                    </p>
                    <h2 className="text-lg font-semibold leading-6 text-white">
                      <PreserveScrollLink
                        href={item.detailHref}
                        className="transition hover:text-amber-200"
                      >
                        {item.title}
                      </PreserveScrollLink>
                    </h2>
                    <p className="text-sm leading-6 text-stone-400">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {isReady && !showMeta ? (
        <div className={`grid items-start gap-1 ${gridColumnsClass}`}>
          {groupedItems.map((group, columnIndex) => (
            <div key={`column-${columnIndex}`} className="flex flex-col gap-1">
              {group.map((item) => {
                const originalIndex = visibleItems.findIndex((entry) => entry.ssd === item.ssd);
                const imageOnlyHeight =
                  imageOnlyHeights[originalIndex % imageOnlyHeights.length];
                const imageOnlyStyle = { height: `${imageOnlyHeight}px` };

                return (
                  <article
                    key={item.ssd}
                    data-waterfall-index={visibleItemIndexMap.get(item.ssd)}
                    data-waterfall-ssd={item.ssd}
                    className="group relative overflow-hidden rounded-none border-0 bg-transparent shadow-none"
                  >
                    <PreserveScrollLink
                      href={item.detailHref}
                      className="block"
                    >
                      {item.previewUrl ? (
                        <div className="overflow-hidden" style={imageOnlyStyle}>
                          <Image
                            src={item.previewUrl}
                            alt={item.title}
                            width={1920}
                            height={1080}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
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

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pb-4 pt-10 opacity-0 transition duration-300 group-hover:opacity-100">
                        <p className="text-sm font-medium leading-6 text-white">
                          {item.title}
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
