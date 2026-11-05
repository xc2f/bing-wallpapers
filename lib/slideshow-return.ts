// Page numbers change as the gallery loads, but the filtered slideshow stays the same.
export function slideshowReturnKey(href: string) {
  const url = new URL(href, "https://gallery.local");
  for (const key of ["page", "view", "from"]) url.searchParams.delete(key);
  url.searchParams.sort();
  return `slideshow-return:${url.pathname}?${url.searchParams}`;
}
