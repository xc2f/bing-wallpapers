import SiteDocument, { siteMetadata } from "@/components/site-document";
import LocalePreference from "@/components/locale-preference";
import "../globals.css";
export const metadata = siteMetadata;
import { notFound } from "next/navigation";
import {
  getDictionary,
  htmlLangMap,
  isValidLocale,
  type Locale,
} from "@/lib/i18n";

export default async function LocalizedLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const dictionary = getDictionary(currentLocale);
  const githubUrl = "https://github.com/xc2f/bing-wallpapers";

  return (
    <SiteDocument locale={currentLocale}>
    <LocalePreference locale={currentLocale} />
    <div lang={htmlLangMap[currentLocale]} className="flex min-h-screen min-w-0 flex-col">
      <div className="min-w-0 flex-1">{children}</div>
      <footer className="section-divider px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="min-w-0 break-words text-[11px] uppercase tracking-[0.22em] text-stone-400">
              {dictionary.archiveLabel}
            </p>
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 text-sm text-stone-500 transition hover:text-stone-200"
            >
              <span>{dictionary.footerGithub}</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="max-w-6xl space-y-1.5 break-words text-sm leading-6 text-stone-500">
            <p>{dictionary.footerDisclaimerLine1}</p>
            <p>{dictionary.footerDisclaimerLine2}</p>
            <p>{dictionary.footerDisclaimerLine3}</p>
            <p>{dictionary.footerDisclaimerLine4}</p>
          </div>
        </div>
      </footer>
    </div>
    </SiteDocument>
  );
}
