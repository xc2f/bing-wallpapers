import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import { THEME_COOKIE_KEY, normalizeThemeMode, type ThemeMode } from "@/lib/theme";
import "./globals.css";

type ResolvedTheme = "light" | "dark";

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "light" || mode === "dark") {
    return mode;
  }

  return "dark";
}

export const metadata: Metadata = {
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeMode = normalizeThemeMode(cookieStore.get(THEME_COOKIE_KEY)?.value);
  const resolvedTheme = resolveTheme(themeMode);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme-mode={themeMode}
      data-theme-resolved={resolvedTheme}
    >
      <body className="bg-stone-950 text-stone-100 antialiased">
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
