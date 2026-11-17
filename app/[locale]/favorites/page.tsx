import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FavoritesGallery from "@/components/favorites-gallery";
import ScrollToTopButton from "@/components/scroll-to-top-button";
import { favoriteLabels } from "@/lib/favorite-labels";
import { getDictionary, isValidLocale, localizePath } from "@/lib/i18n";
import { siteUrl } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return {
    title: favoriteLabels[locale].page,
    robots: { index: false, follow: true },
  };
}

export default async function FavoritesPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  return (
    <main className="bg-stone-950 px-4 pb-10 pt-5 text-stone-100 sm:px-6 sm:pt-6 lg:px-8">
      <ScrollToTopButton label={dictionary.backToTop} />
      <FavoritesGallery locale={locale} site={{
        name: dictionary.siteTitle,
        url: siteUrl(localizePath(locale)),
      }} />
    </main>
  );
}
