import FavoriteIcon from "@/components/favorite-icon";
import Link from "next/link";
import { favoriteLabels } from "@/lib/favorite-labels";
import { localizePath, type Locale } from "@/lib/i18n";

export default function FavoritesLink({ locale, hidden }: { locale: Locale; hidden: boolean }) {
  return (
    <Link href={localizePath(locale, "/favorites")}
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-stone-100 transition-colors duration-200 theme-button-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--theme-accent-ring-rgb))] ${hidden ? "invisible" : ""}`}>
      <FavoriteIcon />
      {favoriteLabels[locale].page}
    </Link>
  );
}
