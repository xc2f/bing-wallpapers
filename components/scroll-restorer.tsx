"use client";

import { useEffect } from "react";

const SCROLL_STORAGE_PREFIX = "scroll-position:";
const SCROLL_ANCHOR_PREFIX = "scroll-anchor:";
const SCROLL_ANCHOR_SSD_PREFIX = "scroll-anchor-ssd:";
const SCROLL_ANCHOR_OFFSET_PREFIX = "scroll-anchor-offset:";

interface ScrollRestorerProps {
  storageKey: string;
}

export default function ScrollRestorer({ storageKey }: ScrollRestorerProps) {
  useEffect(() => {
    const fallbackKey = storageKey.split("?")[0];
    const hasAnchorSsd =
      Boolean(sessionStorage.getItem(`${SCROLL_ANCHOR_SSD_PREFIX}${storageKey}`)) ||
      Boolean(sessionStorage.getItem(`${SCROLL_ANCHOR_SSD_PREFIX}${fallbackKey}`));

    if (hasAnchorSsd) {
      return;
    }

    const positionStorageKey = sessionStorage.getItem(
      `${SCROLL_STORAGE_PREFIX}${storageKey}`
    )
      ? storageKey
      : fallbackKey;
    const savedPosition = sessionStorage.getItem(
      `${SCROLL_STORAGE_PREFIX}${positionStorageKey}`
    );

    if (!savedPosition) {
      return;
    }

    const scrollY = Number(savedPosition);
    const targetY = Number.isNaN(scrollY) ? 0 : scrollY;
    let attempts = 0;
    let frameId = 0;

    function restoreScroll() {
      attempts += 1;
      window.scrollTo({ top: targetY });

      const isCloseEnough = Math.abs(window.scrollY - targetY) < 4;
      const reachedBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;

      if (isCloseEnough || reachedBottom || attempts >= 120) {
        sessionStorage.removeItem(`${SCROLL_STORAGE_PREFIX}${storageKey}`);
        sessionStorage.removeItem(`${SCROLL_STORAGE_PREFIX}${fallbackKey}`);
        sessionStorage.removeItem(`${SCROLL_ANCHOR_PREFIX}${storageKey}`);
        sessionStorage.removeItem(`${SCROLL_ANCHOR_PREFIX}${fallbackKey}`);
        sessionStorage.removeItem(`${SCROLL_ANCHOR_SSD_PREFIX}${storageKey}`);
        sessionStorage.removeItem(`${SCROLL_ANCHOR_SSD_PREFIX}${fallbackKey}`);
        sessionStorage.removeItem(`${SCROLL_ANCHOR_OFFSET_PREFIX}${storageKey}`);
        sessionStorage.removeItem(`${SCROLL_ANCHOR_OFFSET_PREFIX}${fallbackKey}`);
        return;
      }

      frameId = window.requestAnimationFrame(restoreScroll);
    }

    frameId = window.requestAnimationFrame(restoreScroll);

    return () => window.cancelAnimationFrame(frameId);
  }, [storageKey]);

  return null;
}
