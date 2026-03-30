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
    <div lang={htmlLangMap[currentLocale]} className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
      <footer className="border-t border-white/10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-600">
              {dictionary.archiveLabel}
            </p>
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-stone-500 transition hover:text-stone-200"
            >
              <span>{dictionary.footerGithub}</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="max-w-6xl space-y-1.5 text-sm leading-6 text-stone-500">
            <p>{dictionary.footerDisclaimerLine1}</p>
            <p>{dictionary.footerDisclaimerLine2}</p>
            <p>{dictionary.footerDisclaimerLine3}</p>
            <p>{dictionary.footerDisclaimerLine4}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
