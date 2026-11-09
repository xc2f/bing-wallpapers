"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import PreserveScrollLink from "@/components/preserve-scroll-link";
import { WATERFALL_BATCH_SIZE } from "@/lib/waterfall-pagination";
import type { Locale } from "@/lib/i18n";

export interface SlideshowItem {
  ssd: string;
  title: string;
  previewUrl: string;
  wallpaperUrl?: string;
  detailHref: string;
}

const labels = {
  en: ["Image preview", "Close", "Previous", "Next", "Play", "Pause", "View details", "Could not load more images. Try again."],
  zh: ["图片预览", "关闭", "上一张", "下一张", "播放", "暂停", "查看详情", "加载更多图片失败，请再试一次。"],
  es: ["Vista previa", "Cerrar", "Anterior", "Siguiente", "Reproducir", "Pausar", "Ver detalles", "No se pudieron cargar más imágenes. Inténtalo de nuevo."],
  fr: ["Aperçu", "Fermer", "Précédente", "Suivante", "Lire", "Pause", "Voir les détails", "Impossible de charger d’autres images. Réessayez."],
  de: ["Bildvorschau", "Schließen", "Zurück", "Weiter", "Abspielen", "Pause", "Details ansehen", "Weitere Bilder konnten nicht geladen werden. Erneut versuchen."],
  ja: ["画像プレビュー", "閉じる", "前へ", "次へ", "再生", "一時停止", "詳細を見る", "画像を読み込めませんでした。もう一度お試しください。"],
  ko: ["이미지 미리보기", "닫기", "이전", "다음", "재생", "일시 정지", "상세 보기", "이미지를 더 불러오지 못했습니다. 다시 시도하세요."],
} as const satisfies Record<Locale, readonly string[]>;

const SLIDE_DURATION_MS = 7000;

const controlClass = "inline-flex size-11 items-center justify-center rounded-full bg-black/35 transition-colors hover:bg-black/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40";

const controlPaths = {
  close: "m6 6 12 12M18 6 6 18",
  previous: "m15 6-6 6 6 6",
  next: "m9 6 6 6-6 6",
  play: "M9 5v14l11-7z",
  pause: "M9 5v14m6-14v14",
  details: "M12 11v5m0-8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
} as const;

function ControlIcon({ name }: { name: keyof typeof controlPaths }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill={name === "play" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={controlPaths[name]} />
    </svg>
  );
}

export default function WaterfallSlideshow({
  initialItem, initialIndex, trigger, items, itemsOffset = 0, totalCount, loadPage, onClose, onDetails, detailHref, locale, loadingLabel,
}: {
  initialItem: SlideshowItem;
  initialIndex?: number;
  trigger: HTMLAnchorElement;
  items: SlideshowItem[];
  itemsOffset?: number;
  totalCount: number;
  loadPage: (page: number) => Promise<SlideshowItem[] | null>;
  onClose: () => void;
  onDetails: (item: SlideshowItem, index: number) => void;
  detailHref: (href: string) => string;
  locale: Locale;
  loadingLabel: string;
}) {
  const [heading, close, previous, next, play, pause, details, loadError] = labels[locale];
  const [{ item, index }, setSlide] = useState(() => ({
    item: initialItem,
    index: initialIndex ?? itemsOffset + items.findIndex((entry) => entry.ssd === initialItem.ssd),
  }));
  const [displayed, setDisplayed] = useState({ item, index });
  const [previousImage, setPreviousImage] = useState<SlideshowItem | null>(null);
  const [failedWallpaperUrls, setFailedWallpaperUrls] = useState<ReadonlySet<string>>(() => new Set());
  const pendingImageRef = useRef<HTMLImageElement>(null);
  const waitingForImage = displayed.item.ssd !== item.ssd;
  const pageCacheRef = useRef(new Map<number, SlideshowItem[]>());
  const pageRequestsRef = useRef(new Map<number, Promise<SlideshowItem[] | null>>());
  const preloadedImageRef = useRef<HTMLImageElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [controlsHidden, setControlsHidden] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mountedRef = useRef(false);
  const loadingRef = useRef(false);
  const controlsTimerRef = useRef<number | undefined>(undefined);
  const imagePointerRef = useRef<{ id: number; x: number; y: number; toggleOnTap: boolean } | null>(null);
  const canPlay = totalCount > 1;
  const controlsVisible = !playing || !controlsHidden;
  const controlsVisibility = controlsVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0";
  const getSlideUrl = useCallback((slide: SlideshowItem) => {
    const { wallpaperUrl, previewUrl } = slide;
    return wallpaperUrl && !failedWallpaperUrls.has(wallpaperUrl) ? wallpaperUrl : previewUrl;
  }, [failedWallpaperUrls]);

  const fallBackToPreview = useCallback((slide: SlideshowItem) => {
    const { wallpaperUrl, previewUrl } = slide;
    if (!wallpaperUrl || !previewUrl || previewUrl === wallpaperUrl || getSlideUrl(slide) !== wallpaperUrl) return false;

    setFailedWallpaperUrls((current) => new Set(current).add(wallpaperUrl));
    return true;
  }, [getSlideUrl]);

  function togglePlayback() {
    if (canPlay) setPlaying((current) => !current);
  }

  const revealControls = useCallback(() => {
    setControlsHidden(false);
    window.clearTimeout(controlsTimerRef.current);
    if (playing) {
      controlsTimerRef.current = window.setTimeout(() => setControlsHidden(true), 3000);
    }
  }, [playing]);

  useEffect(() => {
    revealControls();
    return () => window.clearTimeout(controlsTimerRef.current);
  }, [revealControls]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    mountedRef.current = true;
    const overflow = document.body.style.overflow;
    const scrollTop = window.scrollY;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    window.scrollTo(0, scrollTop);
    return () => {
      mountedRef.current = false;
      dialog.close();
      document.body.style.overflow = overflow;
      if (trigger.isConnected) {
        trigger.focus({ preventScroll: true });
        window.scrollTo(0, scrollTop);
      }
    };
  }, [trigger]);

  const getPage = useCallback((page: number) => {
    const cached = pageCacheRef.current.get(page);
    if (cached) return Promise.resolve(cached);

    const pending = pageRequestsRef.current.get(page);
    if (pending) return pending;

    const request = loadPage(page).then((batch) => {
      if (batch) pageCacheRef.current.set(page, batch);
      return batch;
    }).finally(() => pageRequestsRef.current.delete(page));
    pageRequestsRef.current.set(page, request);
    return request;
  }, [loadPage]);

  const move = useCallback(async (direction: -1 | 1) => {
    if (!canPlay || loadingRef.current) return;
    setFailed(false);

    let nextIndex = index;
    try {
      for (let checked = 1; checked < totalCount; checked++) {
        nextIndex = (nextIndex + direction + totalCount) % totalCount;
        let target = items[nextIndex - itemsOffset];
        if (!target) {
          const page = Math.floor(nextIndex / WATERFALL_BATCH_SIZE) + 1;
          let batch = pageCacheRef.current.get(page);
          if (!batch) {
            loadingRef.current = true;
            setLoading(true);
            batch = (await getPage(page)) ?? undefined;
            if (!mountedRef.current) return;
            if (!batch) throw new Error("Could not load slideshow page");
          }
          target = batch[nextIndex % WATERFALL_BATCH_SIZE];
        }

        if (target && getSlideUrl(target)) {
          setSlide({ item: target, index: nextIndex });
          return;
        }
      }
      setPlaying(false);
    } catch {
      if (mountedRef.current) {
        setPlaying(false);
        setFailed(true);
      }
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [canPlay, getPage, getSlideUrl, index, items, itemsOffset, totalCount]);

  useEffect(() => {
    const image = pendingImageRef.current;
    if (!waitingForImage || !image) return;

    let cancelled = false;
    let frame = 0;
    image.decode().then(() => {
      if (cancelled) return;
      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => {
          setPreviousImage(displayed.item);
          setDisplayed({ item, index });
        });
      });
    }).catch(() => {
      if (cancelled) return;
      if (fallBackToPreview(item)) return;
      setSlide(displayed);
      setPlaying(false);
      setFailed(true);
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [displayed, index, item, fallBackToPreview, waitingForImage]);

  useEffect(() => {
    if (!previousImage) return;
    const timer = window.setTimeout(() => setPreviousImage(null), 220);
    return () => window.clearTimeout(timer);
  }, [previousImage]);

  useEffect(() => {
    if (!canPlay || waitingForImage) return;

    let cancelled = false;
    async function preloadNext() {
      if (document.hidden) return;

      const nextIndex = (displayed.index + 1) % totalCount;
      let nextImage: SlideshowItem | undefined = items[nextIndex - itemsOffset];
      if (!nextImage) {
        const page = Math.floor(nextIndex / WATERFALL_BATCH_SIZE) + 1;
        const batch = await getPage(page).catch(() => null);
        nextImage = batch?.[nextIndex % WATERFALL_BATCH_SIZE];
      }

      const url = nextImage && getSlideUrl(nextImage);
      if (cancelled || document.hidden || !url || preloadedImageRef.current?.getAttribute("src") === url) return;

      const image = new window.Image();
      image.fetchPriority = "low";
      image.referrerPolicy = "no-referrer";
      image.src = url;
      preloadedImageRef.current = image;
    }

    function handleVisibility() {
      if (!document.hidden) void preloadNext();
    }

    void preloadNext();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [canPlay, displayed.index, getPage, getSlideUrl, items, itemsOffset, totalCount, waitingForImage]);

  useEffect(() => {
    if (!playing || loading || waitingForImage) return;
    if (!canPlay) {
      setPlaying(false);
      return;
    }
    let timer: number | undefined;
    function schedule() {
      window.clearTimeout(timer);
      if (!document.hidden) {
        timer = window.setTimeout(() => {
          if (!document.hidden) void move(1);
        }, SLIDE_DURATION_MS);
      }
    }

    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [canPlay, loading, move, playing, waitingForImage]);

  useEffect(() => {
    const wakeLock = navigator.wakeLock;
    if (!playing || !canPlay || !wakeLock) return;

    let lock: WakeLockSentinel | undefined;
    let requestVersion = 0;

    function release() {
      // Invalidate any request that is still waiting for the browser.
      requestVersion++;
      if (lock && !lock.released) void lock.release().catch(() => {});
      lock = undefined;
    }

    async function syncWakeLock() {
      if (document.hidden) {
        release();
        return;
      }
      if (lock && !lock.released) return;

      const version = ++requestVersion;
      try {
        const nextLock = await wakeLock.request("screen");
        if (version !== requestVersion || document.hidden) {
          await nextLock.release();
        } else {
          lock = nextLock;
        }
      } catch {
        // Playback can continue if the browser denies the wake lock.
      }
    }

    void syncWakeLock();
    document.addEventListener("visibilitychange", syncWakeLock);
    return () => {
      document.removeEventListener("visibilitychange", syncWakeLock);
      release();
    };
  }, [canPlay, playing]);

  const imageLayers = Array.from(new Map(
    [previousImage, displayed.item, item].filter((image) => image !== null).map((image) => [image.ssd, image])
  ).values());

  return (
    <dialog
      ref={dialogRef}
      aria-label={heading}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerMove={revealControls}
      onPointerDown={revealControls}
      onKeyDown={(event) => {
        revealControls();
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onClose();
          return;
        }

        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          void move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
      className="fixed inset-0 m-0 h-[100dvh] max-h-none w-full max-w-none overflow-hidden bg-black p-0 text-[#f5f5f4]"
    >
      <div
        className="absolute inset-0 touch-pan-y overflow-hidden bg-black"
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) {
            imagePointerRef.current = null;
            return;
          }
          imagePointerRef.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            toggleOnTap: event.pointerType !== "touch" || controlsVisible,
          };
        }}
        onPointerCancel={() => { imagePointerRef.current = null; }}
        onPointerUp={(event) => {
          const start = imagePointerRef.current;
          imagePointerRef.current = null;
          if (!start || start.id !== event.pointerId) return;

          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (event.pointerType === "touch" && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            void move(dx > 0 ? -1 : 1);
          } else if (start.toggleOnTap && Math.hypot(dx, dy) < 10) {
            togglePlayback();
          }
        }}
      >
        {imageLayers.map((image) => {
          const active = image.ssd === displayed.item.ssd;
          const pending = waitingForImage && image.ssd === item.ssd;
          const outgoing = image.ssd === previousImage?.ssd;
          return (
            <Image
              key={image.ssd}
              ref={pending ? pendingImageRef : undefined}
              src={getSlideUrl(image)}
              onError={pending ? undefined : () => { fallBackToPreview(image); }}
              alt={active ? image.title : ""}
              aria-hidden={!active}
              fill
              sizes="100vw"
              loading="eager"
              draggable={false}
              referrerPolicy="no-referrer"
              style={{
                animationDuration: `${SLIDE_DURATION_MS}ms`,
                animationPlayState: active && playing ? "running" : "paused",
              }}
              className={`select-none bg-black object-cover motion-safe:transition-opacity motion-safe:duration-200 ${pending && !outgoing ? "opacity-0" : "opacity-100"} ${active || outgoing ? "waterfall-slideshow-zoom" : ""}`}
            />
          );
        })}
      </div>

      <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent motion-safe:transition-opacity ${controlsVisible ? "opacity-100" : "opacity-0"}`} />
      <span className={`pointer-events-none absolute left-[max(1rem,env(safe-area-inset-left))] top-[max(1.5rem,env(safe-area-inset-top))] whitespace-nowrap text-xs tabular-nums text-[#d6d3d1] motion-safe:transition-opacity ${controlsVisible ? "opacity-100" : "opacity-0"}`}>
        {displayed.index + 1} / {totalCount}
      </span>
      <button
        type="button"
        aria-label={close}
        title={close}
        className={`${controlClass} absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] motion-safe:transition-[background-color,opacity] ${controlsVisibility}`}
        onClick={onClose}
      >
        <ControlIcon name="close" />
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent pt-12">
        <div className="flex flex-col gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="min-w-0" aria-live={playing ? "off" : "polite"}>
            <p className="break-words text-base font-semibold drop-shadow sm:text-xl">{displayed.item.title}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 self-end">
            {(loading || failed) && <p className="text-right text-xs text-[#d6d3d1]" role="status">{loading ? loadingLabel : loadError}</p>}
            <div className={`flex flex-wrap justify-end gap-2 motion-safe:transition-opacity ${controlsVisibility}`}>
              <button type="button" aria-label={previous} title={previous} className={controlClass} disabled={!canPlay || loading} onClick={() => void move(-1)}>
                <ControlIcon name="previous" />
              </button>
              <button type="button" aria-label={playing ? pause : play} title={playing ? pause : play} className={controlClass} disabled={!canPlay && !playing} onClick={togglePlayback}>
                <ControlIcon name={playing ? "pause" : "play"} />
              </button>
              <button type="button" aria-label={next} title={next} className={controlClass} disabled={!canPlay || loading} onClick={() => void move(1)}>
                <ControlIcon name="next" />
              </button>
              <PreserveScrollLink href={`${detailHref(displayed.item.detailHref)}&from=slideshow`} onClick={(event) => {
                if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
                setPlaying(false);
                onDetails(displayed.item, displayed.index);
              }} scrollAnchor={trigger.closest<HTMLElement>("[data-waterfall-index]")} aria-label={details} title={details} className={controlClass}>
                <ControlIcon name="details" />
              </PreserveScrollLink>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
