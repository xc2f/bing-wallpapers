import type { Metadata } from "next";
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
  return (
    <html lang="en">
      <body className="bg-stone-950 text-stone-100 antialiased">{children}</body>
    </html>
  );
}
