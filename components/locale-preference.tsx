"use client";
import { useEffect } from "react";
import { localeCookieName, type Locale } from "@/lib/i18n";
export default function LocalePreference({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);
  return null;
}
