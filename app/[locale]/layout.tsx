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
      <footer className="border-t border-white/10 px-4 py-6 text-sm text-stone-500 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl leading-6">
            <p>{dictionary.footerDisclaimerLine1}</p>
            <p>{dictionary.footerDisclaimerLine2}</p>
            <p>{dictionary.footerDisclaimerLine3}</p>
            <p>{dictionary.footerDisclaimerLine4}</p>
          </div>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-stone-400 transition hover:text-white"
          >
            <span>{dictionary.footerGithub}</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
