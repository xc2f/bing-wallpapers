"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

interface DetailRelatedStripProps {
  children: ReactNode;
}

export default function DetailRelatedStrip({ children }: DetailRelatedStripProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const wheelFrameRef = useRef<number | null>(null);
  const targetScrollLeftRef = useRef<number | null>(null);
  const pendingScrollLeftRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const dragStateRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startScrollLeft: number;
  }>({
    active: false,
    moved: false,
    startX: 0,
    startScrollLeft: 0,
  });

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const container = containerRef.current;

    if (!container || event.button !== 0) {
      return;
    }

    if (wheelFrameRef.current !== null) {
      window.cancelAnimationFrame(wheelFrameRef.current);
      wheelFrameRef.current = null;
    }

    targetScrollLeftRef.current = null;

    dragStateRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
    };
    suppressClickRef.current = false;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    const dragState = dragStateRef.current;

    if (!container || !dragState.active) {
      return;
    }

    const distance = event.clientX - dragState.startX;
    if (Math.abs(distance) > 6) {
      dragState.moved = true;
      suppressClickRef.current = true;
    }

    pendingScrollLeftRef.current = dragState.startScrollLeft - distance;

    if (dragFrameRef.current !== null) {
      return;
    }

    dragFrameRef.current = window.requestAnimationFrame(() => {
      if (containerRef.current && pendingScrollLeftRef.current !== null) {
        containerRef.current.scrollLeft = pendingScrollLeftRef.current;
      }

      dragFrameRef.current = null;
    });
  }

  function handlePointerUp() {
    dragStateRef.current.active = false;
    pendingScrollLeftRef.current = null;
  }

  function handleClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    function handleWheel(event: WheelEvent) {
      const activeContainer = containerRef.current;

      if (!activeContainer) {
        return;
      }

      const maxScrollLeft =
        activeContainer.scrollWidth - activeContainer.clientWidth;

      if (maxScrollLeft <= 0) {
        return;
      }

      let delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

      if (delta === 0) {
        return;
      }

      // Normalize line/page based wheel deltas into pixel-ish movement.
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        delta *= 22;
      } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        delta *= activeContainer.clientWidth;
      }

      const currentTarget =
        targetScrollLeftRef.current ?? activeContainer.scrollLeft;
      const nextScrollLeft = Math.min(Math.max(currentTarget + delta, 0), maxScrollLeft);

      if (nextScrollLeft === currentTarget) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      targetScrollLeftRef.current = nextScrollLeft;

      if (wheelFrameRef.current !== null) {
        return;
      }

      function animateWheelScroll() {
        const activeContainer = containerRef.current;
        const targetScrollLeft = targetScrollLeftRef.current;

        if (!activeContainer || targetScrollLeft === null) {
          wheelFrameRef.current = null;
          return;
        }

        const distance = targetScrollLeft - activeContainer.scrollLeft;

        if (Math.abs(distance) < 0.75) {
          activeContainer.scrollLeft = targetScrollLeft;
          targetScrollLeftRef.current = null;
          wheelFrameRef.current = null;
          return;
        }

        activeContainer.scrollLeft += distance * 0.18;
        wheelFrameRef.current = window.requestAnimationFrame(animateWheelScroll);
      }

      wheelFrameRef.current = window.requestAnimationFrame(animateWheelScroll);
    }

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current);
      }

      if (wheelFrameRef.current !== null) {
        window.cancelAnimationFrame(wheelFrameRef.current);
      }

      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <div className="relative -mx-4">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
        onDragStartCapture={(event) => event.preventDefault()}
        className="cursor-grab overflow-x-auto overscroll-x-contain px-4 pb-2 [touch-action:pan-y] [-ms-overflow-style:none] [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex min-w-max gap-3 select-none">{children}</div>
      </div>
    </div>
  );
}
