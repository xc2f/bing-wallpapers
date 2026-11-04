// Next Image is unoptimized on this site, so sizes/quality do not resize the
// source. Ask Bing for a bounded image before downloading and decoding it.
export function resizeBingImage(imageUrl: string, width: number, height: number) {
  if (!imageUrl) return imageUrl;

  try {
    const url = new URL(imageUrl);
    if (
      url.pathname !== "/th" ||
      !/(^|\.)bing\.(com|net)$/.test(url.hostname)
    ) {
      return imageUrl;
    }

    url.searchParams.set("w", String(width));
    url.searchParams.set("h", String(height));
    url.searchParams.set("c", "7");
    return url.toString();
  } catch {
    return imageUrl;
  }
}
