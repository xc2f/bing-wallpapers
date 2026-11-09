import type { Metadata } from "next";
import { htmlLangMap, type Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";
import Script from "next/script";

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Bing Wallpapers Archive",
  description: "Browse locally archived Bing wallpapers.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
};

export default function SiteDocument({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  return (
    <html
      lang={htmlLangMap[locale]}
      suppressHydrationWarning
      data-theme-mode="system"
      data-theme-resolved="dark"
    >
      <body className="bg-stone-950 text-stone-100 antialiased">
        {/* This shell is rendered exclusively by the App Router root layouts. */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function () {
            var storageKey = "bing-wallpapers-theme";
            var cookieKey = "bing-wallpapers-theme";
            var root = document.documentElement;
            var storedTheme = root.dataset.themeMode || "system";

            function readCookie(name) {
              var prefix = name + "=";
              var parts = document.cookie ? document.cookie.split("; ") : [];

              for (var index = 0; index < parts.length; index += 1) {
                if (parts[index].indexOf(prefix) === 0) {
                  return parts[index].slice(prefix.length);
                }
              }

              return "";
            }

            try {
              storedTheme = localStorage.getItem(storageKey) || readCookie(cookieKey) || storedTheme;
            } catch (error) {
              storedTheme = readCookie(cookieKey) || storedTheme;
            }

            var resolvedTheme = storedTheme;
            if (storedTheme === "system") {
              resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            }

            root.dataset.themeMode = storedTheme;
            root.dataset.themeResolved = resolvedTheme;
            root.style.colorScheme = resolvedTheme;

            try {
              localStorage.setItem(storageKey, storedTheme);
            } catch (error) {}

            document.cookie = cookieKey + "=" + storedTheme + "; path=/; max-age=31536000; samesite=lax";
          })();
        `}</Script>
        {children}
      </body>
    </html>
  );
}
