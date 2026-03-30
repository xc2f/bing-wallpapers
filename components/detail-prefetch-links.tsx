"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface DetailPrefetchLinksProps {
  hrefs: string[];
}

export default function DetailPrefetchLinks({ hrefs }: DetailPrefetchLinksProps) {
  const router = useRouter();

  useEffect(() => {
    hrefs.forEach((href) => {
      if (href) {
        router.prefetch(href);
      }
    });
  }, [hrefs, router]);

  return null;
}
