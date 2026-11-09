"use client";
import Link from "next/link";
import SmartBackButton from "@/components/smart-back-button";
import ThemeSwitcher from "@/components/theme-switcher";
import { localeLabels, locales, type Locale } from "@/lib/i18n";
import { useDetailBrowse } from "@/components/detail-browse-context";
function LocaleSwitcher({ locale, languagePaths }: { locale: Locale; languagePaths: Record<Locale, string> }) {
  const { searchParams } = useDetailBrowse();
  return <nav className="theme-locale-switcher flex flex-wrap items-center gap-1.5 text-xs tracking-[0.08em] text-stone-400">
    {locales.map((option) => {
      const params = new URLSearchParams(searchParams);
      params.delete("mode");
      if (option !== locale) params.delete("page");
      const path = languagePaths[option];
      const href = path.includes("/wallpaper/") && params.size ? `${path}?${params}` : path;
      return <Link key={option} href={href} prefetch={false} replace
        className={`theme-locale-switcher-link inline-flex min-h-9 min-w-[2rem] items-center justify-center px-1.5 py-1 text-center sm:min-h-7 ${option === locale ? "theme-locale-switcher-link-active text-amber-300" : "theme-button-hover rounded-md transition hover:text-white"}`}>
        {localeLabels[option]}
      </Link>;
    })}
  </nav>;
}
export default function DetailBrowseHeader({ languagePaths }: { languagePaths: Record<Locale, string> }) {
  const { currentLocale, dictionary, searchParams: resolvedSearchParams, backHref } = useDetailBrowse();
  return (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <SmartBackButton
                fallbackHref={backHref}
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white transition theme-button-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                label={
                  resolvedSearchParams.view === "waterfall" && resolvedSearchParams.from === "slideshow"
                    ? dictionary.detailBackToSlideshow
                    : dictionary.detailBack
                }
              />
              <ThemeSwitcher
                labels={{
                  trigger: dictionary.themeLabel,
                  dialog: dictionary.themeDialogLabel,
                  system: dictionary.themeAuto,
                  light: dictionary.themeLight,
                  dark: dictionary.themeDark,
                }}
              />
              <div className="col-span-2 min-w-0 justify-self-end sm:col-span-1">
                <LocaleSwitcher
                  locale={currentLocale}
                  languagePaths={languagePaths}
                />
              </div>
            </div>
  );
}
export function DetailQueryBadge() {
  const { dictionary, searchParams: { q: query } } = useDetailBrowse();
  return query ? <div className="mt-4 flex flex-wrap gap-2">
    <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-stone-300">
      <span className="text-stone-500">{dictionary.activeQuery}</span>
      <span className="min-w-0 font-medium text-white [overflow-wrap:anywhere]">{query}</span>
    </span>
  </div> : null;
}
