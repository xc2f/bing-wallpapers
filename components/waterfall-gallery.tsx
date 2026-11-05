"use client";


import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import WaterfallViewOptions, { manualColumnChoices, type WaterfallView, viewDefaults } from "@/components/waterfall-view-options";
import WaterfallSlideshow, { type SlideshowItem } from "@/components/waterfall-slideshow";
import PreserveScrollLink from "@/components/preserve-scroll-link";
import { slideshowReturnKey } from "@/lib/slideshow-return";
import { wallpaperFilterParams, type WallpaperFilters } from "@/lib/wallpaper-filters";
import type { Dictionary, Locale } from "@/lib/i18n";

const WATERFALL_VIEW_STORAGE_KEY = "waterfall-view";
const WATERFALL_META_STORAGE_KEY = "waterfall-show-meta";
const SCROLL_STORAGE_PREFIX = "scroll-position:";
const SCROLL_ANCHOR_PREFIX = "scroll-anchor:";
const SCROLL_ANCHOR_SSD_PREFIX = "scroll-anchor-ssd:";
const SCROLL_ANCHOR_OFFSET_PREFIX = "scroll-anchor-offset:";
const INITIAL_BATCH_SIZE = 24;
const LOAD_MORE_BATCH_SIZE = 16;

interface WaterfallGalleryProps {
  dictionary: Dictionary;
  initialPage: number;
  locale: Locale;
  storageKey: string;
  totalCount: number;
  totalPages: number;
  filters: WallpaperFilters;
  items: (SlideshowItem & {
    fullDate?: string;
    description?: string;
  })[];
}

const cardAppearance = [
  { imageGap: 4, detailGap: 8, imageRadius: "0.375rem", detailRadius: "0.5rem" },
  { imageGap: 8, detailGap: 16, imageRadius: "1.15rem", detailRadius: "1.75rem" },
  { imageGap: 16, detailGap: 24, imageRadius: "1.5rem", detailRadius: "2rem" },
] as const;

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

function estimateMetaHeight(item: WaterfallGalleryProps["items"][number], info: number) {
  const titleLines = Math.max(1, Math.ceil(item.title.length / 26));
  const description = item.description ?? "";
  const descriptionLines = Math.max(2, Math.min(7, Math.ceil(description.length / 92)));
  return 280 + (info & 1 ? titleLines * 28 : 0) + (info & 2 ? 32 : 0) + descriptionLines * 24;
}

function getFittingColumnCount(width: number, minColumnWidth: number, gap: number, maxColumns: number) {
  return Math.max(1, Math.min(maxColumns, Math.floor((width + gap) / (minColumnWidth + gap))));
}

function getInitialView(): WaterfallView {
  try {
    const fallbackInfo = window.localStorage.getItem(WATERFALL_META_STORAGE_KEY) === "true" ? 7 : viewDefaults.info;
    const saved = JSON.parse(window.localStorage.getItem(WATERFALL_VIEW_STORAGE_KEY) ?? "null");
    if (!saved) return { ...viewDefaults, info: fallbackInfo };
    const storedInfo = Number.isInteger(saved.info) && saved.info >= 0 && saved.info <= 7 ? saved.info : fallbackInfo;
    // Older preferences allowed arbitrary combinations; keep the highest enabled information level.
    const info = storedInfo & 4 ? 7 : storedInfo & 2 ? 3 : storedInfo & 1 ? 1 : 0;
    return {
      info,
      grid: saved.grid === true,
      columns: manualColumnChoices.find((count) => count === saved.columns) ?? 0,
      wide: saved.wide === true,
      appearance: saved.appearance === 0 || saved.appearance === 2 ? saved.appearance : viewDefaults.appearance,
    };
  } catch {
    return viewDefaults;
  }
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

function WaterfallDescription({ text, expanded, onToggle, dictionary }: {
  text: string;
  expanded: boolean;
  onToggle: () => void;
  dictionary: Dictionary;
}) {
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const paragraph = paragraphRef.current;
    if (!paragraph) return;

    function measure() {
      if (!paragraph) return;
      const lineHeight = Number.parseFloat(getComputedStyle(paragraph).lineHeight);
      setOverflows(paragraph.scrollHeight > lineHeight * 4 + 1);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(paragraph);
    return () => observer.disconnect();
  }, [expanded, text]);

  return (
    <>
      <div className={!expanded && overflows ? "waterfall-description-fade relative" : undefined}>
        <p ref={paragraphRef} className={`text-sm leading-6 text-stone-400 ${expanded ? "" : "line-clamp-4"}`}>
          {text}
        </p>
      </div>
      {overflows && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="theme-button-hover rounded-md text-xs uppercase tracking-[0.22em] text-stone-400 transition hover:text-stone-200"
        >
          {expanded ? dictionary.waterfallCollapseDescription : dictionary.waterfallExpandDescription}
        </button>
      )}
    </>
  );
}

export default function WaterfallGallery({
  dictionary,
  initialPage,
  locale,
  storageKey,
  totalCount,
  totalPages,
  filters,
  items,
}: WaterfallGalleryProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loadedItems, setLoadedItems] = useState(items);
  const [loadedPage, setLoadedPage] = useState(initialPage);
  const [view, setView] = useState(viewDefaults);
  const [galleryWidth, setGalleryWidth] = useState(0);
  const showMeta = Boolean(view.info & 4);
  const appearance = cardAppearance[view.appearance];
  const columnGap = appearance.detailGap;
  const autoColumns = getFittingColumnCount(galleryWidth, 300, columnGap, 6);
  const columnCount = view.columns ? Math.min(view.columns, autoColumns) : autoColumns;
  const viewAnchorRef = useRef<{ ssd: string; top: number } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const toolbarStartRef = useRef<HTMLSpanElement | null>(null);
  const [toolbarStuck, setToolbarStuck] = useState(false);
  const hasRestoredAnchorRef = useRef(false);
  const fetchInFlightRef = useRef<Promise<WaterfallGalleryProps["items"]> | null>(null);
  const [preview, setPreview] = useState<{ item: SlideshowItem; index?: number; trigger: HTMLAnchorElement } | null>(null);
  const previousLoadedCountRef = useRef(items.length);

  useEffect(() => {
    const gallery = sectionRef.current;
    if (!gallery) return;

    let lastScroll = -Infinity;
    function pauseImageHover() {
      lastScroll = performance.now();
      if (!gallery?.hasAttribute("data-scroll-hover-paused")) {
        gallery?.setAttribute("data-scroll-hover-paused", "");
      }
    }

    function resumeImageHover(event: PointerEvent) {
      if (event.pointerType === "mouse" && performance.now() - lastScroll > 120) {
        gallery?.removeAttribute("data-scroll-hover-paused");
      }
    }

    window.addEventListener("scroll", pauseImageHover, { passive: true });
    gallery.addEventListener("pointermove", resumeImageHover, { passive: true });
    return () => {
      window.removeEventListener("scroll", pauseImageHover);
      gallery.removeEventListener("pointermove", resumeImageHover);
    };
  }, []);

  const hasMetaPayload = useMemo(
    () => loadedItems.some((item) => Boolean(item.fullDate || item.description)),
    [loadedItems]
  );
  const baseSearchParams = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    params.delete("mode");
    return params;
  }, [searchParams]);
  const detailSearch = useMemo(() => {
    const params = new URLSearchParams(baseSearchParams.toString());
    params.set("view", "waterfall");
    params.set("page", String(loadedPage));
    const nextSearch = params.toString();
    return nextSearch ? `?${nextSearch}` : "";
  }, [baseSearchParams, loadedPage]);
  const hasMoreServerItems = loadedPage < totalPages;

  function createDetailHref(detailHref: string) {
    return `${detailHref}${detailSearch}`;
  }

  const replaceCurrentUrl = useCallback((nextPage: number) => {
    const params = new URLSearchParams(baseSearchParams.toString());

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }

    const nextSearch = params.toString();
    const nextHref = nextSearch ? `${pathname}?${nextSearch}` : pathname;
    if (nextHref !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", nextHref);
    }
  }, [baseSearchParams, pathname]);

  function handleViewChange(nextView: WaterfallView) {
    const layoutChanges =
      view.grid !== nextView.grid ||
      view.columns !== nextView.columns ||
      view.wide !== nextView.wide ||
      view.appearance !== nextView.appearance ||
      (view.info !== nextView.info && ((view.info | nextView.info) & 4) !== 0);

    if (layoutChanges) {
      const toolbar = toolbarRef.current?.getBoundingClientRect();
      if (toolbar && toolbar.bottom < window.innerHeight) {
        // Sample the first visible row below the sticky toolbar. Avoid measuring every loaded card.
        for (const offset of [8, 40, 96]) {
          const y = toolbar.bottom + offset;
          if (y >= window.innerHeight) break;
          const card = document.elementFromPoint(toolbar.left + 24, y)
            ?.closest<HTMLElement>("[data-waterfall-ssd]");
          if (card?.dataset.waterfallSsd) {
            viewAnchorRef.current = {
              ssd: card.dataset.waterfallSsd,
              top: card.getBoundingClientRect().top,
            };
            break;
          }
        }
      }
    }

    setView(nextView);
  }

  useLayoutEffect(() => {
    const anchor = viewAnchorRef.current;
    if (!anchor) return;

    viewAnchorRef.current = null;
    const frame = window.requestAnimationFrame(() => {
      const card = sectionRef.current?.querySelector<HTMLElement>(
        `[data-waterfall-ssd="${CSS.escape(anchor.ssd)}"]`
      );
      if (card) {
        window.scrollBy(0, card.getBoundingClientRect().top - anchor.top);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [view]);

  function handleToggleDescription(ssd: string) {
    setExpandedDescriptions((current) => ({
      ...current,
      [ssd]: !current[ssd],
    }));
  }

  function announceStatus(message: string) {
    setLiveAnnouncement("");
    window.requestAnimationFrame(() => {
      setLiveAnnouncement(message);
    });
  }

  const fetchWaterfallPage = useCallback(async (page: number) => {
    const params = new URLSearchParams({ locale, page: String(page) });
    wallpaperFilterParams(filters).forEach((value, key) => params.set(key, value));
    const response = await fetch(`/api/waterfall?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return null;

    const payload = (await response.json()) as { items?: WaterfallGalleryProps["items"]; page?: number };
    return payload.items && payload.page === page ? payload.items : null;
  }, [filters, locale]);

  const fetchMoreItems = useCallback(() => {
    if (fetchInFlightRef.current) return fetchInFlightRef.current;
    if (!hasMoreServerItems) return Promise.resolve([]);

    async function requestBatch() {
      setIsFetchingMore(true);
      try {
        const nextPage = loadedPage + 1;
        const nextItems = await fetchWaterfallPage(nextPage);
        if (!nextItems) return [];

        const seen = new Set(loadedItems.map((item) => item.ssd));
        const batch = nextItems.filter((item) => !seen.has(item.ssd));
        setLoadedItems((current) => [...current, ...batch]);
        setLoadedPage(nextPage);
        return batch;
      } catch {
        return [];
      } finally {
        fetchInFlightRef.current = null;
        setIsFetchingMore(false);
      }
    }

    const request = requestBatch();
    fetchInFlightRef.current = request;
    return request;
  }, [fetchWaterfallPage, hasMoreServerItems, loadedItems, loadedPage]);

  function openPreview(event: MouseEvent<HTMLAnchorElement>, item: WaterfallGalleryProps["items"][number]) {
    if (event.defaultPrevented || !(item.wallpaperUrl || item.previewUrl) || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    setPreview({ item, trigger: event.currentTarget });
  }

  useEffect(() => {
    const start = toolbarStartRef.current;
    if (!start) return;

    // Match the toolbar's top-2 offset.
    const observer = new IntersectionObserver(([entry]) => {
      setToolbarStuck(entry.boundingClientRect.bottom < (entry.rootBounds?.top ?? 0));
    }, { rootMargin: "-8px 0px 0px" });
    observer.observe(start);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const updateWidth = () => setGalleryWidth(section.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(section);
    return () => observer.disconnect();
  }, [view.wide]);

  useLayoutEffect(() => {
    const nextView = getInitialView();
    const savedAnchorIndex = getSavedAnchorIndex(storageKey, items);
    const nextVisibleCount = savedAnchorIndex
      ? Math.min(
          Math.max(INITIAL_BATCH_SIZE, savedAnchorIndex + LOAD_MORE_BATCH_SIZE),
          items.length
        )
      : INITIAL_BATCH_SIZE;

    setLoadedItems(items);
    setLoadedPage(initialPage);
    setView(nextView);
    setVisibleCount(nextVisibleCount);
    setIsReady(true);
  }, [initialPage, items, storageKey]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(WATERFALL_VIEW_STORAGE_KEY, JSON.stringify(view));
  }, [isReady, view]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    replaceCurrentUrl(loadedPage);
  }, [isReady, loadedPage, replaceCurrentUrl]);

  useEffect(() => {
    if (!isReady) {
      previousLoadedCountRef.current = loadedItems.length;
      return;
    }

    if (isFetchingMore) {
      announceStatus(dictionary.waterfallLoadingMore);
      return;
    }

    if (loadedItems.length > previousLoadedCountRef.current) {
      announceStatus(`${dictionary.waterfallLoaded} ${loadedItems.length} / ${totalCount}`);
    }

    previousLoadedCountRef.current = loadedItems.length;
  }, [dictionary.waterfallLoaded, dictionary.waterfallLoadingMore, isFetchingMore, isReady, loadedItems.length, totalCount]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const savedAnchorIndex = getSavedAnchorIndex(storageKey, loadedItems);

    if (!savedAnchorIndex || Number.isNaN(savedAnchorIndex)) {
      return;
    }

    setVisibleCount((current) =>
      Math.min(
        Math.max(current, savedAnchorIndex + LOAD_MORE_BATCH_SIZE),
        loadedItems.length
      )
    );
  }, [isReady, loadedItems, loadedItems.length, storageKey]);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!isReady || !node || visibleCount >= loadedItems.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }

        setVisibleCount((current) =>
          Math.min(current + LOAD_MORE_BATCH_SIZE, loadedItems.length)
        );
      },
      {
        rootMargin: "1200px 0px",
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isReady, loadedItems.length, visibleCount]);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!isReady || !node || !hasMoreServerItems) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting || fetchInFlightRef.current) {
          return;
        }

        if (visibleCount >= loadedItems.length - LOAD_MORE_BATCH_SIZE / 2) {
          void fetchMoreItems();
        }
      },
      {
        rootMargin: "1400px 0px",
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [fetchMoreItems, hasMoreServerItems, isReady, loadedItems.length, visibleCount]);

  const gridTemplateColumns = `repeat(${columnCount}, minmax(0, 1fr))`;
  const imageSizes = view.wide
    ? `${Math.ceil(100 / columnCount)}vw`
    : `(min-width: 1280px) ${Math.ceil(1280 / columnCount)}px, ${Math.ceil(100 / columnCount)}vw`;
  const showTitle = Boolean(view.info & 1);
  const showDate = Boolean(view.info & 2);
  const shouldRenderMeta = showMeta && hasMetaPayload;
  const visibleItems = useMemo(
    () => loadedItems.slice(0, visibleCount),
    [loadedItems, visibleCount]
  );
  const groupedItems = useMemo(() => {
    if (view.grid) return [visibleItems];

    const columns = Array.from({ length: columnCount }, () => [] as typeof items);
    const columnHeights = Array.from({ length: columnCount }, () => 0);

    visibleItems.forEach((item, index) => {
      const estimatedHeight = shouldRenderMeta
        ? estimateMetaHeight(item, view.info)
        : imageOnlyHeights[index % imageOnlyHeights.length];
      const targetColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

      columns[targetColumnIndex].push(item);
      columnHeights[targetColumnIndex] += estimatedHeight;
    });

    return columns;
  }, [columnCount, shouldRenderMeta, view.grid, view.info, visibleItems]);
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
    if (!isReady || preview) return;
    const key = slideshowReturnKey(storageKey);
    const saved = window.sessionStorage.getItem(key);
    if (!saved) return;

    try {
      const state = JSON.parse(saved) as { item: SlideshowItem; index: number; triggerSsd: string };
      if (!state.item?.ssd || !Number.isInteger(state.index) || state.index < 0 || state.index >= totalCount || typeof state.triggerSsd !== "string") {
        window.sessionStorage.removeItem(key);
        return;
      }
      const trigger = sectionRef.current?.querySelector<HTMLAnchorElement>(
        `[data-waterfall-ssd="${CSS.escape(state.triggerSsd)}"] a[aria-haspopup="dialog"]`
      );
      if (!trigger) return;

      // Let the gallery's scroll restoration finish before locking the dialog's scroll.
      const frame = window.requestAnimationFrame(() => {
        window.sessionStorage.removeItem(key);
        setPreview({ item: state.item, index: state.index, trigger });
      });
      return () => window.cancelAnimationFrame(frame);
    } catch {
      window.sessionStorage.removeItem(key);
    }
  }, [groupedItems, isReady, preview, storageKey, totalCount]);

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
    <section ref={sectionRef} data-waterfall-wide={view.wide} className="relative flex min-w-0 flex-col gap-6">
      <span ref={toolbarStartRef} aria-hidden="true" className="pointer-events-none absolute -top-px left-0 size-px" />
      <div
        ref={toolbarRef}
        className={`sticky top-2 z-20 flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 ${
          toolbarStuck
            ? "pointer-events-none border-transparent"
            : "border-white/10 bg-stone-950/78 backdrop-blur"
        }`}
      >
        <div aria-hidden={toolbarStuck} className={`flex items-center gap-2 text-sm text-stone-400 ${toolbarStuck ? "invisible" : ""}`}>
          <span className="text-stone-500">{dictionary.archived}</span>
          <span className="font-medium text-stone-100">{totalCount}</span>
        </div>
        <WaterfallViewOptions locale={locale} view={view} autoColumns={autoColumns} onChange={handleViewChange} compact={toolbarStuck} />
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </p>

      {!isReady ? <div className="min-h-[24rem]" aria-hidden="true" /> : null}

      {isReady && shouldRenderMeta ? (
        <div className="grid items-start" style={{ gridTemplateColumns, gap: appearance.detailGap }}>
          {groupedItems.map((group, columnIndex) => (
            <div key={`meta-column-${columnIndex}`} className={view.grid ? "contents" : "flex min-w-0 flex-col"} style={{ gap: appearance.detailGap }}>
              {group.map((item) => {
                const isExpanded = Boolean(expandedDescriptions[item.ssd]);
                const description = item.description ?? dictionary.noDescription;
                const visibleIndex = visibleItemOrderMap.get(item.ssd) ?? 0;
                const prioritizeImage = visibleIndex < 12;

                return (
                <article
                  key={item.ssd}
                  data-waterfall-index={visibleItemIndexMap.get(item.ssd)}
                  data-waterfall-ssd={item.ssd}
                  className="min-w-0 overflow-hidden border border-white/10 bg-white/5 shadow-2xl shadow-black/20"
                  style={{ borderRadius: appearance.detailRadius }}
                >
                  <PreserveScrollLink
                    href={createDetailHref(item.detailHref)}
                    onClick={(event) => openPreview(event, item)}
                    aria-haspopup={item.wallpaperUrl || item.previewUrl ? "dialog" : undefined}
                    className="block"
                  >
                    {item.previewUrl ? (
                      <div className={`waterfall-image-frame relative overflow-hidden bg-stone-900/80 ${view.grid ? "aspect-video" : "aspect-[16/10] min-h-[15rem]"}`}>
                        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-20 bg-gradient-to-b from-black/12 to-transparent" />
                        <Image
                          referrerPolicy="no-referrer"
                          src={item.previewUrl}
                          alt={item.title}
                          width={1920}
                          height={1080}
                          sizes={imageSizes}
                          quality={68}
                          priority={prioritizeImage}
                          loading={prioritizeImage ? "eager" : "lazy"}
                          className="waterfall-image-preview h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`flex items-center justify-center bg-stone-900 px-6 text-sm text-stone-400 ${view.grid ? "aspect-video" : "min-h-56"}`}>
                        {dictionary.noPreviewImage}
                      </div>
                    )}
                  </PreserveScrollLink>

                  <div className="space-y-4 p-5">
                    {showDate && <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                      {item.fullDate ?? item.ssd}
                    </p>}
                    {showTitle && <h2 className="text-lg font-semibold leading-6 text-white">
                      <PreserveScrollLink
                        href={createDetailHref(item.detailHref)}
                        className="block break-words transition hover:text-amber-200"
                      >
                        {item.title}
                      </PreserveScrollLink>
                    </h2>}
                    <WaterfallDescription
                      text={description}
                      expanded={isExpanded}
                      onToggle={() => handleToggleDescription(item.ssd)}
                      dictionary={dictionary}
                    />
                  </div>
                </article>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}

      {isReady && !shouldRenderMeta ? (
        <div className="grid items-start" style={{ gridTemplateColumns, gap: appearance.imageGap }}>
          {groupedItems.map((group, columnIndex) => (
            <div key={`column-${columnIndex}`} className={view.grid ? "contents" : "flex min-w-0 flex-col"} style={{ gap: appearance.imageGap }}>
              {group.map((item) => {
                const originalIndex = visibleItemOrderMap.get(item.ssd) ?? 0;
                const imageOnlyHeight =
                  imageOnlyHeights[originalIndex % imageOnlyHeights.length];
                const imageOnlyStyle = view.grid ? { aspectRatio: "16 / 9" } : { height: `${imageOnlyHeight}px` };
                const prioritizeImage = originalIndex < 16;

                return (
                  <article
                    key={item.ssd}
                    data-waterfall-index={visibleItemIndexMap.get(item.ssd)}
                    data-waterfall-ssd={item.ssd}
                    className="group relative min-w-0 overflow-hidden border border-white/5 bg-white/[0.02] shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
                    style={{ borderRadius: appearance.imageRadius }}
                  >
                    <PreserveScrollLink
                      href={createDetailHref(item.detailHref)}
                      onClick={(event) => openPreview(event, item)}
                      aria-haspopup={item.wallpaperUrl || item.previewUrl ? "dialog" : undefined}
                      className="block"
                    >
                      {item.previewUrl ? (
                        <div className="waterfall-image-frame relative overflow-hidden bg-stone-900/80" style={imageOnlyStyle}>
                          <Image
                            referrerPolicy="no-referrer"
                            src={item.previewUrl}
                            alt={item.title}
                            width={1920}
                            height={1080}
                            sizes={imageSizes}
                            quality={68}
                            priority={prioritizeImage}
                            loading={prioritizeImage ? "eager" : "lazy"}
                            className="waterfall-image-preview h-full w-full object-cover"
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

                      {(showTitle || showDate) && <div className="theme-waterfall-image-caption pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/72 via-black/28 to-transparent px-4 pb-4 pt-12 opacity-100 transition duration-300 sm:opacity-80 sm:group-hover:opacity-100">
                        {showTitle && <p className="theme-waterfall-image-title break-words text-sm font-medium leading-6 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.32)]">
                          {item.title}
                        </p>}
                        {showDate && <p className="theme-waterfall-image-date mt-1 text-[11px] uppercase tracking-[0.24em] text-stone-200/72">
                          {item.fullDate ?? item.ssd}
                        </p>}
                      </div>}
                    </PreserveScrollLink>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}

      {isReady && (visibleCount < loadedItems.length || hasMoreServerItems) ? (
        <div ref={sentinelRef} className="h-12" aria-hidden="true" />
      ) : null}

      {isReady && (hasMoreServerItems || isFetchingMore) ? (
        <div className="flex flex-col items-center gap-2 border-t border-white/10 pt-6 text-sm">
          <p className="text-stone-400" role="status" aria-live="polite" aria-atomic="true">
            {dictionary.waterfallLoaded}{" "}
            <span className="text-stone-100">{loadedItems.length}</span> / {totalCount}
          </p>
          <p className="text-stone-500">
            {isFetchingMore
              ? dictionary.waterfallLoadingMore
              : dictionary.waterfallBatchSize}
          </p>
          {hasMoreServerItems ? (
            <button
              type="button"
              onClick={() => {
                void fetchMoreItems();
              }}
              disabled={isFetchingMore}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm text-white transition theme-button-hover disabled:pointer-events-none disabled:opacity-50 focus-visible:bg-white/10 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(251,191,36,0.2)]"
            >
              {isFetchingMore ? dictionary.waterfallLoadingMore : dictionary.waterfallLoadMore}
            </button>
          ) : null}
        </div>
      ) : null}
      {preview && (
        <WaterfallSlideshow
          initialItem={preview.item}
          initialIndex={preview.index}
          trigger={preview.trigger}
          items={loadedItems}
          totalCount={totalCount}
          loadPage={fetchWaterfallPage}
          onClose={() => {
            window.sessionStorage.removeItem(slideshowReturnKey(storageKey));
            setPreview(null);
          }}
          onDetails={(item, index) => {
            window.sessionStorage.setItem(slideshowReturnKey(storageKey), JSON.stringify({
              item,
              index,
              triggerSsd: preview.trigger.closest<HTMLElement>("[data-waterfall-ssd]")?.dataset.waterfallSsd,
            }));
          }}
          detailHref={createDetailHref}
          locale={locale}
          loadingLabel={dictionary.waterfallLoadingMore}
        />
      )}
    </section>
  );
}
