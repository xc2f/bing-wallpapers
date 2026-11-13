import { NextResponse, type NextRequest } from "next/server";
import {
  detectLocaleFromAcceptLanguage,
  isValidLocale,
  localeCookieName,
  type Locale,
} from "@/lib/i18n"
import { acceptsMarkdown } from "@/lib/markdown-negotiation";
import { apiDiscoveryLinks } from "@/lib/api-discovery";
import { legacyWaterfallQuery } from "@/lib/wallpaper-filters";

function getPreferredLocale(request: NextRequest): Locale {
  const savedLocale = request.cookies.get(localeCookieName)?.value;

  if (savedLocale && isValidLocale(savedLocale)) {
    return savedLocale;
  }

  return detectLocaleFromAcceptLanguage(request.headers.get("accept-language"));
}

function withLocaleCookie(request: NextRequest, response: NextResponse, locale: Locale) {
  // Background prefetches must not change the user's language preference.
  const isPrefetch = request.headers.has("next-router-prefetch") ||
    /\bprefetch\b/i.test(request.headers.get("purpose") ?? "") ||
    /\bprefetch\b/i.test(request.headers.get("sec-purpose") ?? "");

  if (isPrefetch) {
    return response;
  }

  response.cookies.set(localeCookieName, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

function routeRequest(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];
  const isDocumentRequest = request.method === "GET" || request.method === "HEAD";
  if (isDocumentRequest && isValidLocale(maybeLocale) &&
      (pathname === `/${maybeLocale}/waterfall` || pathname === `/${maybeLocale}/waterfall/`)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${maybeLocale}`;
    url.search = legacyWaterfallQuery(request.nextUrl.searchParams);
    return NextResponse.redirect(url, 308);
  }
  const isLocalizedDocument = isValidLocale(maybeLocale ?? "") &&
    /^\/[^/]+(?:\/earth|\/wallpaper\/[^/]+)?\/?$/.test(pathname);

  if (isDocumentRequest && (pathname === "/" || isLocalizedDocument) &&
      !request.headers.has("rsc") && acceptsMarkdown(request.headers.get("accept"))) {
    const url = request.nextUrl.clone();
    const documentPath = pathname === "/" ? `/${getPreferredLocale(request)}` : pathname.replace(/\/$/, "");
    url.pathname = `/api/markdown${documentPath}`;
    return NextResponse.rewrite(url);
  }

  if (maybeLocale && isValidLocale(maybeLocale)) {
    if (isLocalizedDocument && isDocumentRequest) {
      const response = NextResponse.next();
      // The prerender cache can replace Vary with the middleware value.
      response.headers.set("Vary", "Accept, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url");
      return withLocaleCookie(request, response, maybeLocale);
    }
    return withLocaleCookie(request, NextResponse.next(), maybeLocale);
  }

  if (pathname === "/") {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    url.search = search;
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Vary", "Accept, Accept-Language, Cookie, RSC");
    return withLocaleCookie(request, response, locale);
  }

  if (pathname.startsWith("/wallpaper/")) {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    url.search = search;
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "private, no-store");
    return withLocaleCookie(request, response, locale);
  }

  return NextResponse.next();
}

export function middleware(request: NextRequest) {
  const response = routeRequest(request);
  const path = request.nextUrl.pathname.replace(/\/$/, "");
  if ((request.method === "GET" || request.method === "HEAD") &&
      (path === "" || isValidLocale(path.slice(1)))) {
    response.headers.append("Link", apiDiscoveryLinks);
  }
  return response;
}

export const config = {
  matcher: [
    "/",
    "/wallpaper/:path*",
    "/:locale(en|zh|es|fr|de|ja|ko)",
    "/:locale(en|zh|es|fr|de|ja|ko)/earth",
    "/:locale(en|zh|es|fr|de|ja|ko)/waterfall",
    "/:locale(en|zh|es|fr|de|ja|ko)/wallpaper/:ssd",
  ],
};
