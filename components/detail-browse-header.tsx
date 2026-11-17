"use client";
import Link from "next/link";
import SmartBackButton from "@/components/smart-back-button";
import ThemeSwitcher from "@/components/theme-switcher";
import { slideshowReturnKey } from "@/lib/slideshow-return";
import { favoriteLabels } from "@/lib/favorite-labels";
import EarthGalleryLink from "@/components/earth-gallery-link";
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
  const { currentLocale, dictionary, searchParams: resolvedSearchParams, backHref, backToFavorites } = useDetailBrowse();
  return (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SmartBackButton
                fallbackHref={backHref}
                label={backToFavorites ? favoriteLabels[currentLocale].backToFavorites : dictionary.detailBack}
                onBeforeNavigate={() => {
                  if (backToFavorites || resolvedSearchParams.from !== "slideshow") return;
                  try {
                    sessionStorage.removeItem(slideshowReturnKey(backHref));
                  } catch {
                    // The homepage is still available when storage is disabled.
                  }
                }}
              />
              <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-3">
              <EarthGalleryLink locale={currentLocale} />
              <ThemeSwitcher
                labels={{
                  trigger: dictionary.themeLabel,
                  dialog: dictionary.themeDialogLabel,
                  system: dictionary.themeAuto,
                  light: dictionary.themeLight,
                  dark: dictionary.themeDark,
                }}
              />
              <div className="min-w-0">
                <LocaleSwitcher
                  locale={currentLocale}
                  languagePaths={languagePaths}
                />
              </div>
              </div>
            </div>
  );
}
