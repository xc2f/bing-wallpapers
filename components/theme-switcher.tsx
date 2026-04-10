"use client";

import { useEffect, useId, useRef, useState } from "react";
import { THEME_COOKIE_KEY, type ThemeMode } from "@/lib/theme";
type ResolvedTheme = "light" | "dark";

interface ThemeSwitcherProps {
  initialMode?: ThemeMode;
  labels: {
    system: string;
    light: string;
    dark: string;
  };
}

const THEME_STORAGE_KEY = "bing-wallpapers-theme";

function getCookieTheme(): ThemeMode {
  if (typeof document === "undefined") {
    return "system";
  }

  const prefix = `${THEME_COOKIE_KEY}=`;
  const parts = document.cookie ? document.cookie.split("; ") : [];

  for (const part of parts) {
    if (part.startsWith(prefix)) {
      const cookieTheme = part.slice(prefix.length);
      if (cookieTheme === "light" || cookieTheme === "dark" || cookieTheme === "system") {
        return cookieTheme;
      }
    }
  }

  return "system";
}

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
    return storedTheme;
  }

  return getCookieTheme();
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "light" || mode === "dark") {
    return mode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(mode: ThemeMode) {
  const resolvedTheme = resolveTheme(mode);
  const root = document.documentElement;

  root.dataset.themeMode = mode;
  root.dataset.themeResolved = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  document.cookie = `${THEME_COOKIE_KEY}=${mode}; path=/; max-age=31536000; samesite=lax`;
}

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === "light") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="h-4 w-4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="8" cy="8" r="2.75" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M8 1.75V3.25M8 12.75V14.25M14.25 8H12.75M3.25 8H1.75M12.42 3.58L11.36 4.64M4.64 11.36L3.58 12.42M12.42 12.42L11.36 11.36M4.64 4.64L3.58 3.58"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (mode === "dark") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="h-4 w-4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10.92 1.93a5.92 5.92 0 1 0 3.15 10.84A6.28 6.28 0 0 1 10.92 1.93Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2.25" y="3" width="11.5" height="8" rx="1.75" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.25 13H10.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function ThemeSwitcher({ initialMode = "system", labels }: ThemeSwitcherProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof document === "undefined") {
      return initialMode;
    }

    return (
      (document.documentElement.dataset.themeMode as ThemeMode | undefined) ??
      getStoredTheme() ??
      initialMode
    );
  });
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const initialMode = getStoredTheme();
    setThemeMode(initialMode);
    applyTheme(initialMode);
  }, []);

  useEffect(() => {
    if (themeMode !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [themeMode]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleThemeChange(nextMode: ThemeMode) {
    setThemeMode(nextMode);
    applyTheme(nextMode);
    setOpen(false);
  }

  const options: Array<{ value: ThemeMode; label: string }> = [
    { value: "system", label: labels.system },
    { value: "light", label: labels.light },
    { value: "dark", label: labels.dark },
  ];
  const currentLabel = options.find((option) => option.value === themeMode)?.label ?? labels.system;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-9 min-w-[5.75rem] items-center justify-between gap-2 rounded-full px-3 text-xs text-stone-300 transition hover:text-white"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <ThemeIcon mode={themeMode} />
          <span className="truncate">{currentLabel}</span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className={`h-4 w-4 text-stone-500 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.5 6.25L8 9.75l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="theme-floating-panel theme-switcher-menu absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-[9rem] overflow-hidden rounded-xl border border-white/[0.08] bg-stone-950 py-1 shadow-[0_10px_28px_rgba(0,0,0,0.16)] backdrop-blur-xl"
        >
          {options.map((option) => {
            const isActive = option.value === themeMode;

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => handleThemeChange(option.value)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                  isActive
                    ? "bg-white/[0.06] text-white"
                    : "text-stone-300 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <ThemeIcon mode={option.value} />
                  <span>{option.label}</span>
                </span>
                {isActive ? (
                  <span aria-hidden="true" className="text-amber-300">
                    •
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
