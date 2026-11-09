// Clear stale destination anchors without moving the current filter viewport.
export function resetWaterfallFilterScroll(target: string) {
  const [pathname] = target.split("?");
  for (const key of new Set([target, pathname])) {
    for (const prefix of ["scroll-position:", "scroll-anchor:", "scroll-anchor-ssd:", "scroll-anchor-offset:"]) {
      window.sessionStorage.removeItem(`${prefix}${key}`);
    }
  }
  // The gallery can briefly shrink while new results mount. Restore this
  // viewport after navigation instead of letting that layout change reset it.
  window.sessionStorage.setItem(`scroll-position:${target}`, String(window.scrollY));
}
