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
