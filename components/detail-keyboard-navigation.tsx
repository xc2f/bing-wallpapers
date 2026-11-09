"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface DetailKeyboardNavigationProps {
  leftHref?: string;
  rightHref?: string;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
}

export default function DetailKeyboardNavigation({
  leftHref,
  rightHref,
}: DetailKeyboardNavigationProps) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "ArrowLeft" && leftHref) {
        event.preventDefault();
        router.push(leftHref);
        return;
      }

      if (event.key === "ArrowRight" && rightHref) {
        event.preventDefault();
        router.push(rightHref);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rightHref, leftHref, router]);

  return null;
}
