import SiteDocument, { siteMetadata } from "@/components/site-document";
import { defaultLocale } from "@/lib/i18n";
import "../globals.css";
export const metadata = siteMetadata;
export default function EntryLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument locale={defaultLocale}>{children}</SiteDocument>;
}
