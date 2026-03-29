"use client";

import Link, { type LinkProps } from "next/link";
import type { MouseEvent } from "react";

const SCROLL_STORAGE_PREFIX = "scroll-position:";
const SCROLL_ANCHOR_PREFIX = "scroll-anchor:";
const SCROLL_ANCHOR_SSD_PREFIX = "scroll-anchor-ssd:";
const SCROLL_ANCHOR_OFFSET_PREFIX = "scroll-anchor-offset:";

interface PreserveScrollLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
}

export default function PreserveScrollLink({
  href,
  children,
  className,
  ...props
}: PreserveScrollLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    const pathnameKey = window.location.pathname;

    sessionStorage.setItem(
      `${SCROLL_STORAGE_PREFIX}${currentUrl}`,
      String(window.scrollY)
    );
    sessionStorage.setItem(
      `${SCROLL_STORAGE_PREFIX}${pathnameKey}`,
      String(window.scrollY)
    );

    const anchorElement = event.currentTarget.closest(
      "[data-waterfall-index]"
    ) as HTMLElement | null;
    const anchorIndex = anchorElement?.dataset.waterfallIndex;
    const anchorSsd = anchorElement?.dataset.waterfallSsd;
    const anchorOffset = anchorElement?.getBoundingClientRect().top;

    if (anchorIndex) {
      sessionStorage.setItem(`${SCROLL_ANCHOR_PREFIX}${currentUrl}`, anchorIndex);
      sessionStorage.setItem(`${SCROLL_ANCHOR_PREFIX}${pathnameKey}`, anchorIndex);
    }

    if (anchorSsd) {
      sessionStorage.setItem(`${SCROLL_ANCHOR_SSD_PREFIX}${currentUrl}`, anchorSsd);
      sessionStorage.setItem(`${SCROLL_ANCHOR_SSD_PREFIX}${pathnameKey}`, anchorSsd);
    }

    if (typeof anchorOffset === "number" && !Number.isNaN(anchorOffset)) {
      sessionStorage.setItem(
        `${SCROLL_ANCHOR_OFFSET_PREFIX}${currentUrl}`,
        String(Math.round(anchorOffset))
      );
      sessionStorage.setItem(
        `${SCROLL_ANCHOR_OFFSET_PREFIX}${pathnameKey}`,
        String(Math.round(anchorOffset))
      );
    }
  }

  return (
    <Link href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
