export type ThemeMode = "system" | "light" | "dark";

export const THEME_COOKIE_KEY = "bing-wallpapers-theme";

export function normalizeThemeMode(value?: string): ThemeMode {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
}
