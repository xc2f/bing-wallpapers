import { NextResponse, type NextRequest } from "next/server";
import {
  detectLocaleFromAcceptLanguage,
  isValidLocale,
  localeCookieName,
  type Locale,
} from "@/lib/i18n"

function getPreferredLocale(request: NextRequest): Locale {
  const savedLocale = request.cookies.get(localeCookieName)?.value;

  if (savedLocale && isValidLocale(savedLocale)) {
    return savedLocale;
  }

  return detectLocaleFromAcceptLanguage(request.headers.get("accept-language"));
}

function withLocaleCookie(response: NextResponse, locale: Locale) {
  response.cookies.set(localeCookieName, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];

  if (maybeLocale && isValidLocale(maybeLocale)) {
    return withLocaleCookie(NextResponse.next(), maybeLocale);
  }

  if (pathname === "/") {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    url.search = search;
    return withLocaleCookie(NextResponse.redirect(url), locale);
  }

  if (pathname.startsWith("/wallpaper/")) {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    url.search = search;
    return withLocaleCookie(NextResponse.redirect(url), locale);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/wallpaper/:path*", "/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
