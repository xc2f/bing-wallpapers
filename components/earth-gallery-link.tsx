"use client";

import Link from "next/link";
import { localizePath, type Locale } from "@/lib/i18n";

const labels: Record<Locale, string> = {
  zh: "地球图集", en: "Explore Earth", es: "Atlas terrestre", fr: "Atlas terrestre",
  de: "Erde erkunden", ja: "地球の写真集", ko: "지구 사진집",
};

export default function EarthGalleryLink({ locale }: { locale: Locale }) {
  return <Link href={localizePath(locale, "/earth")} prefetch={false}
    onNavigate={() => {
      try { sessionStorage.setItem("earth-return-path", window.location.href); } catch { /* Storage may be disabled. */ }
    }}
    className="earth-gallery-entry inline-flex min-h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" /><ellipse cx="10" cy="10" rx="3.3" ry="7.5" /><path d="M2.5 10h15" />
    </svg>
    {labels[locale]}
  </Link>;
}
