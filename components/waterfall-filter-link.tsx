"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";
import { wallpaperFilterKeys } from "@/lib/wallpaper-filters";
import { resetWaterfallFilterScroll } from "@/lib/waterfall-filter-navigation";

export default function WaterfallFilterLink({ href, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const currentParams = useSearchParams();
  const [pathname, search = ""] = href.split("?");
  const params = new URLSearchParams(search);
  const target = params.size ? `${pathname}?${params}` : pathname;
  return <Link prefetch={false} {...props} href={target} scroll={false} onNavigate={(event) => {
    props.onNavigate?.(event);
    const filtersChanged = wallpaperFilterKeys.some((key) =>
      (params.get(key) ?? "") !== (currentParams.get(key) ?? "")
    );
    if (!filtersChanged) return;
    resetWaterfallFilterScroll(target);
  }} />;
}
