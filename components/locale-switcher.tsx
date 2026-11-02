import Link from "next/link";
import { getWallpaperBySsd } from "@/lib/archive";
import { localeLabels, type Locale, localizePath, locales } from "@/lib/i18n";

interface LocaleSwitcherProps {
  locale: Locale;
  pathname: string;
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function LocaleSwitcher({
  locale,
  pathname,
  searchParams,
}: LocaleSwitcherProps) {
  const targetPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const query = new URLSearchParams();

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof value === "string" && value) {
        query.set(key, value);
      }

      if (Array.isArray(value)) {
        value.filter(Boolean).forEach((item) => query.append(key, item));
      }
    });
  }

  const detailSsd = targetPath.match(/^\/wallpaper\/([^/]+)$/)?.[1];

  return (
    <nav className="theme-locale-switcher flex flex-wrap items-center gap-1.5 text-xs tracking-[0.08em] text-stone-400">
      {locales.map((option) => {
        const isActive = option === locale;
        const targetQuery = new URLSearchParams(query);
        if (!isActive) targetQuery.delete("page");
        const search = targetQuery.toString();
        const hasDetail = !detailSsd || Boolean(getWallpaperBySsd(detailSsd, option));
        const href = hasDetail
          ? localizePath(option, `${targetPath}${search ? `?${search}` : ""}`)
          : localizePath(option);

        return (
          <Link
            key={option}
            href={href}
            prefetch={false}
            replace
            className={`theme-locale-switcher-link inline-flex min-w-[2rem] items-center justify-center px-1.5 py-1 text-center ${
              isActive ? "theme-locale-switcher-link-active text-amber-300" : "transition hover:text-white"
            }`}
          >
            {localeLabels[option]}
          </Link>
        );
      })}
    </nav>
  );
}
