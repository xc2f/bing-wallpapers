"use client";

import { useLayoutEffect } from "react";
import { applyTheme, getStoredTheme } from "@/lib/theme";

export default function ThemeSync() {
  useLayoutEffect(() => {
    // A locale change can remount the document shell without rerunning its startup script.
    applyTheme(getStoredTheme());

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };
    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, []);

  return null;
}
