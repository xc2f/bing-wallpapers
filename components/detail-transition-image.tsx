"use client";

import Image from "next/image";
import { useRef } from "react";
import { useIsomorphicLayoutEffect } from "@/lib/isomorphic-effect";
import { animateSharedImage, clippedCornerRadii, type CornerRadii } from "@/lib/shared-image-transition";

const transitionKey = "earth-detail-image-transition";

type TransitionOrigin = {
  pathname: string;
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  radius?: number | CornerRadii;
  createdAt: number;
};

export default function DetailTransitionImage({
  src,
  alt,
  pathname,
}: {
  src: string;
  alt: string;
  pathname: string;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  // Effects run twice in development; keep the origin readable for the replay.
  const pendingOrigin = useRef<{ pathname: string; origin: TransitionOrigin | null } | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (pendingOrigin.current?.pathname !== pathname) {
      let origin: TransitionOrigin | null = null;
      try {
        const value = sessionStorage.getItem(transitionKey);
        if (value) {
          origin = JSON.parse(value) as TransitionOrigin;
          sessionStorage.removeItem(transitionKey);
        }
      } catch { /* Storage can be disabled. */ }
      pendingOrigin.current = { pathname, origin };
    }
    const origin = pendingOrigin.current.origin;
    const originPath = origin?.pathname.replace(/\/$/, "");
    const currentPath = window.location.pathname.replace(/\/$/, "");
    if (!origin || originPath !== currentPath || Date.now() - origin.createdAt > 10_000) return;
    const target = imageRef.current;
    if (!target) return;
    return animateSharedImage(target, origin, { targetRadius: clippedCornerRadii(target) });
  }, [pathname]);

  return <Image
    ref={imageRef}
    referrerPolicy="no-referrer"
    src={src}
    alt={alt}
    width={1920}
    height={1080}
    priority
    className="detail-transition-image block h-auto w-full object-contain"
  />;
}
