type LoaderParams = {
  src: string;
  width: number;
  quality?: number;
};

const appBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";
const enableCloudflareImageResizing =
  process.env.NEXT_PUBLIC_ENABLE_CF_IMAGE_RESIZING === "true";

function withBasePath(path: string) {
  if (!appBasePath || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${appBasePath}${path.startsWith("/") ? path : `/${path}`}`;
}

export default function cloudflareImageLoader({
  src,
  width,
  quality,
}: LoaderParams) {
  const normalizedSrc = withBasePath(src);

  if (process.env.NODE_ENV !== "production" || !enableCloudflareImageResizing) {
    const params = new URLSearchParams();
    params.set("w", String(width));

    if (quality) {
      params.set("q", String(quality));
    }

    const query = params.toString();
    return query
      ? `${normalizedSrc}${normalizedSrc.includes("?") ? "&" : "?"}${query}`
      : normalizedSrc;
  }

  const transformParams = [`width=${width}`, "fit=contain"];

  if (quality) {
    transformParams.push(`quality=${quality}`);
  }

  return `/cdn-cgi/image/${transformParams.join(",")}/${normalizedSrc.replace(
    /^\/+/,
    ""
  )}`;
}
