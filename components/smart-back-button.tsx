"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useWallpaperShortcut } from "@/lib/wallpaper-shortcuts";

interface SmartBackButtonProps {
  fallbackHref: string;
  label: string;
  scroll?: boolean;
  onBeforeNavigate?: () => void;
}

export default function SmartBackButton({
  fallbackHref,
  label,
  scroll = false,
  onBeforeNavigate,
}: SmartBackButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  useWallpaperShortcut("backspace", buttonRef);

  function handleClick() {
    onBeforeNavigate?.();
    router.push(fallbackHref, { scroll });
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-keyshortcuts="Backspace"
      title={`${label} (Backspace)`}
      onClick={handleClick}
      className="theme-button-hover inline-flex min-h-11 w-fit max-w-full items-center gap-1.5 rounded-full border border-[rgb(var(--theme-border-rgb)/0.1)] px-3 py-1.5 text-left text-sm font-medium text-stone-400 transition-colors hover:text-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--theme-accent-ring-rgb))] sm:min-h-9"
    >
      <span aria-hidden="true" className="shrink-0 text-base leading-none">
        ←
      </span>
      {label}
    </button>
  );
}
