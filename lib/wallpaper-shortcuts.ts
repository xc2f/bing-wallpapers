"use client";

import { useEffect, type RefObject } from "react";

export function matchesWallpaperShortcut(event: KeyboardEvent, key: string) {
  if (event.defaultPrevented || event.repeat || event.isComposing || event.key.toLowerCase() !== key ||
      event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;

  const target = event.target;
  return !(target instanceof HTMLElement &&
    (target.isContentEditable || target.closest("input, textarea, select, [role='textbox']")));
}

export function useWallpaperShortcut(key: string, actionRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!matchesWallpaperShortcut(event, key)) return;

      const action = actionRef.current;
      // The detail page renders separate actions for narrow and wide layouts.
      if (!action || action.matches(":disabled") || !action.getClientRects().length) return;
      const modal = document.querySelector("dialog:modal");
      if (modal && !modal.contains(action)) return;

      event.preventDefault();
      action.click();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actionRef, key]);
}
