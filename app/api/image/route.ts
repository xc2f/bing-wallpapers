import { NextRequest, NextResponse } from "next/server";

const baseUrl = new URL(process.env.BASE_URL || "https://www.bing.com");
const allowedHostnames = new Set([baseUrl.hostname]);

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  }

  let targetUrl: URL;

  try {
    targetUrl = new URL(imageUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url parameter." }, { status: 400 });
  }

  if (!allowedHostnames.has(targetUrl.hostname)) {
    return NextResponse.json({ error: "Unsupported image host." }, { status: 400 });
  }

  const upstreamResponse = await fetch(targetUrl.toString(), {
    headers: {
      Referer: `${baseUrl.origin}/`,
      Origin: baseUrl.origin,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
    cache: "force-cache",
  });

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return NextResponse.json(
      { error: "Failed to fetch upstream image." },
      { status: upstreamResponse.status || 502 }
    );
  }

  const headers = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");
  const cacheControl =
    upstreamResponse.headers.get("cache-control") ??
    "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  headers.set("Cache-Control", cacheControl);

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  });
}
