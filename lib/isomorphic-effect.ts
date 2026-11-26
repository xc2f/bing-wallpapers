import { useEffect, useLayoutEffect } from "react";

// Layout effects keep shared-image transitions from painting the destination first.
export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
