import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n";

export default async function LegacyWallpaperPage({
  params,
}: {
  params: Promise<{ ssd: string }>;
}) {
  const { ssd } = await params;
  redirect(`/${defaultLocale}/wallpaper/${ssd}`);
}
