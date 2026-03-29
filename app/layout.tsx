import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  defaultLocale,
  getLocaleFromParam,
  htmlLangMap,
  localeCookieName,
} from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bing Wallpapers Archive",
  description: "Browse locally archived Bing wallpapers.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = getLocaleFromParam(
    cookieStore.get(localeCookieName)?.value ?? defaultLocale
  );

  return (
    <html lang={htmlLangMap[locale]}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
