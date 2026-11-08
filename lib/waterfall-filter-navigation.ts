// Filter changes start a fresh gallery, without restoring an old page's anchor.
export function resetWaterfallFilterScroll(target: string) {
  const [pathname] = target.split("?");
  for (const key of new Set([target, pathname])) {
    for (const prefix of ["scroll-position:", "scroll-anchor:", "scroll-anchor-ssd:", "scroll-anchor-offset:"]) {
      window.sessionStorage.removeItem(`${prefix}${key}`);
    }
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}
