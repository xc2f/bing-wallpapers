export type ThemeMode = "system" | "light" | "dark";

export const THEME_COOKIE_KEY = "bing-wallpapers-theme";

export function normalizeThemeMode(value?: string): ThemeMode {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
}

export function getStoredTheme(): ThemeMode {
  try {
    const mode = window.localStorage.getItem(THEME_COOKIE_KEY);
    if (mode === "light" || mode === "dark" || mode === "system") return mode;
  } catch {
    // Some browsers block local storage while allowing cookies.
  }

  const prefix = `${THEME_COOKIE_KEY}=`;
  const cookie = document.cookie.split("; ").find((part) => part.startsWith(prefix));
  return normalizeThemeMode(cookie?.slice(prefix.length));
}

export function applyTheme(mode: ThemeMode) {
  const resolved = mode === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : mode;
  const root = document.documentElement;

  root.dataset.themeMode = mode;
  root.dataset.themeResolved = resolved;
  root.style.colorScheme = resolved;
}

export function saveTheme(mode: ThemeMode) {
  applyTheme(mode);
  try {
    window.localStorage.setItem(THEME_COOKIE_KEY, mode);
  } catch {
    // Keep the chosen theme for this page and try the cookie for later navigation.
  }
  document.cookie = `${THEME_COOKIE_KEY}=${mode}; path=/; max-age=31536000; samesite=lax`;
}
