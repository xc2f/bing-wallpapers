"use client";

import { useRouter } from "next/navigation";

interface SmartBackButtonProps {
  className?: string;
  fallbackHref: string;
  label: string;
}

export default function SmartBackButton({
  className,
  fallbackHref,
  label,
}: SmartBackButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref, { scroll: false });
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      <span aria-hidden="true" className="text-sm leading-none">
        ←
      </span>
      {label}
    </button>
  );
}
