import Link from "next/link";
import { localizePath, type Locale } from "@/lib/i18n";

const labels: Record<Locale, string> = {
  zh: "地球图集", en: "Explore Earth", es: "Atlas terrestre", fr: "Atlas terrestre",
  de: "Erde erkunden", ja: "地球の写真集", ko: "지구 사진집",
};

export default function EarthGalleryLink({ locale }: { locale: Locale }) {
  return <Link href={localizePath(locale, "/earth")} prefetch={false}
    className="inline-flex min-h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-stone-500/30 px-3 py-1.5 text-xs text-stone-300 transition theme-button-hover hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" /><ellipse cx="10" cy="10" rx="3.3" ry="7.5" /><path d="M2.5 10h15" />
    </svg>
    {labels[locale]}
  </Link>;
}
