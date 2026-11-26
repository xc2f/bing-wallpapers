"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const transitionKey = "earth-detail-image-transition";

type TransitionOrigin = {
  pathname: string;
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
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

  useEffect(() => {
    let origin: TransitionOrigin | undefined;
    try {
      const value = sessionStorage.getItem(transitionKey);
      if (value) origin = JSON.parse(value) as TransitionOrigin;
    } catch {
      return;
    }
    const originPath = origin?.pathname.replace(/\/$/, "");
    const currentPath = window.location.pathname.replace(/\/$/, "");
    if (!origin || originPath !== currentPath || Date.now() - origin.createdAt > 10_000) {
      try { sessionStorage.removeItem(transitionKey); } catch { /* Storage can be disabled. */ }
      return;
    }

    const target = imageRef.current;
    if (!target) return;
    const overlay = document.createElement("img");
    overlay.src = origin.src;
    Object.assign(overlay.style, {
      position: "fixed",
      zIndex: "9999",
      left: `${origin.left}px`,
      top: `${origin.top}px`,
      width: `${origin.width}px`,
      height: `${origin.height}px`,
      objectFit: "contain",
      borderRadius: "9px",
      pointerEvents: "none",
      willChange: "left, top, width, height, border-radius",
      boxShadow: "0 20px 70px rgba(0,0,0,.35)",
    });
    let animation: Animation | undefined;
    let animationFrame = 0;
    let started = false;
    let active = true;
    const finish = () => {
      overlay.remove();
      target.style.visibility = "";
    };
    const start = () => {
      if (started || !active) return;
      started = true;
      animationFrame = requestAnimationFrame(() => {
        if (!active) return;
        try { sessionStorage.removeItem(transitionKey); } catch { /* Storage can be disabled. */ }
        const to = target.getBoundingClientRect();
        if (!to.width || !to.height) {
          finish();
          return;
        }
        target.style.visibility = "hidden";
        animation = overlay.animate([
          { left: `${origin.left}px`, top: `${origin.top}px`, width: `${origin.width}px`, height: `${origin.height}px`, borderRadius: "9px" },
          { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px`, borderRadius: "0px" },
        ], { duration: 720, easing: "cubic-bezier(.22,1,.36,1)" });
        animation.addEventListener("finish", finish, { once: true });
        animation.addEventListener("cancel", finish, { once: true });
      });
    };
    overlay.addEventListener("load", start, { once: true });
    overlay.addEventListener("error", finish, { once: true });
    document.body.append(overlay);
    if (overlay.complete && overlay.naturalWidth) start();
    return () => {
      active = false;
      cancelAnimationFrame(animationFrame);
      animation?.cancel();
      finish();
    };
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
