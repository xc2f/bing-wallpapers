"use client";

import { useRef } from "react";
import { useWallpaperShortcut } from "@/lib/wallpaper-shortcuts";

export default function OpenWallpaperLink({ href, label }: { href: string; label: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useWallpaperShortcut("o", ref);

  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-keyshortcuts="O"
      title={`${label} (O)`}
      className="inline-flex min-h-11 min-w-0 items-center justify-center break-words rounded-full bg-amber-300 px-2 py-2 text-center text-sm font-medium text-stone-950 transition hover:bg-amber-200"
    >
      {label}
    </a>
  );
}
