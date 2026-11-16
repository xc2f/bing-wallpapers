"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type Position = { x: number; y: number };
type MapView = Position & { zoom: number };

const maxZoom = 8;
const zoomStep = 1.4;
const center = { x: 0.5, y: 0.5 };

function clampCenter(position: number, visibleSpan: number) {
  const margin = Math.min(0.5, visibleSpan / 2);
  return Math.max(margin, Math.min(1 - margin, position));
}

function moveView(view: MapView, visibleWidth: number, from: Position, to: Position, factor = 1): MapView {
  const zoom = Math.min(maxZoom, Math.max(1, view.zoom * factor));
  const oldX = clampCenter(view.x, visibleWidth / view.zoom);
  const oldY = clampCenter(view.y, 1 / view.zoom);
  return {
    zoom,
    x: clampCenter(oldX + (from.x - 0.5) * visibleWidth / view.zoom - (to.x - 0.5) * visibleWidth / zoom, visibleWidth / zoom),
    y: clampCenter(oldY + (from.y - 0.5) / view.zoom - (to.y - 0.5) / zoom, 1 / zoom),
  };
}

function relativePosition(position: Position, bounds: DOMRect) {
  return { x: (position.x - bounds.left) / bounds.width, y: (position.y - bounds.top) / bounds.height };
}

function midpoint(first: Position, second: Position) {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

export default function DetailMapViewport({ positions, initialView, labels }: {
  positions: (Position & { label: string })[];
  initialView: MapView;
  labels: { map: string; zoomIn: string; zoomOut: string; reset: string };
}) {
  const [view, setView] = useState(initialView);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);
  const popupId = useId();
  // The source map stays proportional when the viewport is wider than its viewBox.
  const [visibleWidth, setVisibleWidth] = useState(1);
  const { zoom } = view;
  const horizontalZoom = zoom / visibleWidth;
  const left = clampCenter(view.x, visibleWidth / zoom) - visibleWidth / (2 * zoom);
  const top = clampCenter(view.y, 1 / zoom) - 1 / (2 * zoom);
  const markers = positions.map(({ x, y, label }, index) => ({
    x: (x - left) * horizontalZoom * 100,
    y: (y - top) * zoom * 100,
    label,
    index,
  })).filter(({ x, y }) => x >= 0 && x <= 100 && y >= 0 && y <= 100);
  const activeMarker = markers.find(({ index }) => index === (hoveredMarker ?? selectedMarker));
  const viewport = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Position>());
  const markerPress = useRef<{ pointerId: number; origin: Position; moved: boolean } | null>(null);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;

    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (height > 0) setVisibleWidth(Math.max(1, width / (height * (37 / 19))));
    });
    resize.observe(element);
    return () => resize.disconnect();
  }, []);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      // Unmodified scrolling still moves the page.
      if (!event.ctrlKey) return;
      event.preventDefault();
      setSelectedMarker(null);
      setHoveredMarker(null);
      const anchor = relativePosition({ x: event.clientX, y: event.clientY }, element.getBoundingClientRect());
      const factor = Math.exp(-Math.max(-50, Math.min(50, event.deltaY)) * 0.012);
      setView((view) => moveView(view, visibleWidth, anchor, anchor, factor));
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [visibleWidth]);

  function startPointer(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || pointers.current.size >= 2) return;
    const marker = event.target instanceof HTMLElement
      ? event.target.closest<HTMLButtonElement>(".detail-location-map-marker-button")
      : null;
    const origin = { x: event.clientX, y: event.clientY };
    if (!pointers.current.size) {
      markerPress.current = marker ? { pointerId: event.pointerId, origin, moved: false } : null;
    }
    if (!marker) setSelectedMarker(null);
    pointers.current.set(event.pointerId, origin);
    (marker ?? event.currentTarget).setPointerCapture(event.pointerId);
  }

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;

    const current = { x: event.clientX, y: event.clientY };
    const press = markerPress.current;
    if (press && !press.moved) {
      if (pointers.current.size === 1 && press.pointerId === event.pointerId &&
          Math.hypot(current.x - press.origin.x, current.y - press.origin.y) < 5) return;
      press.moved = true;
      setSelectedMarker(null);
      setHoveredMarker(null);
    }
    pointers.current.set(event.pointerId, current);
    const other = [...pointers.current.entries()].find(([id]) => id !== event.pointerId)?.[1];
    const bounds = event.currentTarget.getBoundingClientRect();
    if (other) {
      const previousDistance = Math.hypot(previous.x - other.x, previous.y - other.y);
      const distance = Math.hypot(current.x - other.x, current.y - other.y);
      const from = relativePosition(midpoint(previous, other), bounds);
      const to = relativePosition(midpoint(current, other), bounds);
      setView((view) => moveView(view, visibleWidth, from, to, distance / Math.max(1, previousDistance)));
    } else {
      const from = relativePosition(previous, bounds);
      const to = relativePosition(current, bounds);
      setView((view) => moveView(view, visibleWidth, from, to));
    }
  }

  function endPointer(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
  }

  function zoomBy(factor: number) {
    setView((view) => moveView(view, visibleWidth, center, center, factor));
  }

  function resetView() {
    setSelectedMarker(null);
    setHoveredMarker(null);
    setView(initialView);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const directions: Record<string, Position> = {
      ArrowLeft: { x: -0.15, y: 0 },
      ArrowRight: { x: 0.15, y: 0 },
      ArrowUp: { x: 0, y: -0.15 },
      ArrowDown: { x: 0, y: 0.15 },
    };
    const direction = directions[event.key];

    if (direction) setView((view) => moveView(view, visibleWidth, direction, { x: 0, y: 0 }));
    else if (event.key === "+" || event.key === "=") zoomBy(zoomStep);
    else if (event.key === "-") zoomBy(1 / zoomStep);
    else if (event.key === "Home") resetView();
    else if (event.key === "Escape" && activeMarker) {
      setSelectedMarker(null);
      setHoveredMarker(null);
    }
    else return;

    event.preventDefault();
  }

  return (
    <div className="detail-location-map-plot relative aspect-[37/19] w-full overflow-hidden lg:aspect-[16/5] lg:max-h-[260px]">
      <div
        ref={viewport}
        role="group"
        aria-label={labels.map}
        tabIndex={0}
        className="detail-location-map-viewport absolute inset-0 select-none"
        onKeyDown={handleKeyDown}
        onPointerDown={startPointer}
        onPointerMove={movePointer}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onLostPointerCapture={endPointer}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            width: `${horizontalZoom * 100}%`,
            height: `${zoom * 100}%`,
            left: `${-left * horizontalZoom * 100}%`,
            top: `${-top * zoom * 100}%`,
          }}
        >
          <Image
            src="/maps/wallpaper-outline.svg"
            alt=""
            fill
            unoptimized
            draggable={false}
            className="detail-location-map-outline object-contain"
          />
        </div>
        {markers.map(({ x, y, label, index }) => (
          <button
            key={index}
            type="button"
            aria-label={label}
            aria-expanded={activeMarker?.index === index}
            aria-controls={activeMarker?.index === index ? popupId : undefined}
            className="detail-location-map-marker-button absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
            style={{ left: `${x}%`, top: `${y}%` }}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse" && event.buttons === 0) setHoveredMarker(index);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") setHoveredMarker((marker) => marker === index ? null : marker);
            }}
            onClick={(event) => {
              if (event.detail && markerPress.current?.moved) return;
              setSelectedMarker(selectedMarker === index ? null : index);
            }}
          >
            <span aria-hidden="true" className="detail-location-map-marker pointer-events-none" />
          </button>
        ))}
        {activeMarker ? (
          <div
            id={popupId}
            role="status"
            className="detail-location-map-popup pointer-events-none absolute z-10 text-center"
            data-below={activeMarker.y < 50 || undefined}
            style={{
              left: `clamp(min(50%, 8rem), ${activeMarker.x}%, max(50%, calc(100% - 8rem)))`,
              top: `${activeMarker.y}%`,
            }}
          >
            <p className="break-words text-xs font-semibold">{activeMarker.label}</p>
          </div>
        ) : null}
      </div>
      <div className="detail-location-map-controls absolute right-2 top-2 z-20 flex sm:right-3 sm:top-3">
        <button type="button" aria-label={labels.zoomIn} title={labels.zoomIn} disabled={zoom === maxZoom} onClick={() => zoomBy(zoomStep)}>+</button>
        <button type="button" aria-label={labels.zoomOut} title={labels.zoomOut} disabled={zoom === 1} onClick={() => zoomBy(1 / zoomStep)}>−</button>
        <button type="button" aria-label={labels.reset} title={labels.reset} onClick={resetView}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <circle cx="12" cy="12" r="7" />
            <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>
    </div>
  );
}
