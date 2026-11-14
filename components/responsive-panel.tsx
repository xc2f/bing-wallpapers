"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

interface ResponsivePanelProps {
  open: boolean;
  onClose: () => void;
  id: string;
  label: string;
  className: string;
  children: ReactNode;
  contentRef?: RefObject<HTMLDivElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

// Desktop popovers share one native modal sheet on small screens.
export default function ResponsivePanel({ open, onClose, id, label, className, children, contentRef, returnFocusRef }: ResponsivePanelProps) {
  const [mobile, setMobile] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resolvedContentRef = contentRef ?? panelRef;
  const focusRef = useRef(returnFocusRef);
  focusRef.current = returnFocusRef;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    if (!open || mobile) return;
    const panel = resolvedContentRef.current;
    // The positioned wrapper is the anchor, including the full search field.
    const anchor = panel?.offsetParent;
    if (!panel || !anchor) return;

    const viewport = window.visualViewport;
    let frame = 0;

    function updatePlacement() {
      if (!panel || !anchor) return;
      const bounds = anchor.getBoundingClientRect();
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportBottom = viewportTop + (viewport?.height ?? document.documentElement.clientHeight);
      const style = window.getComputedStyle(panel);
      const gap = parseFloat(style.marginTop);
      const edgePadding = 8;
      const spaceAbove = bounds.top - viewportTop - gap - edgePadding;
      const spaceBelow = viewportBottom - bounds.bottom - gap - edgePadding;
      const panelHeight = panel.scrollHeight + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      const opensUp = panelHeight > spaceBelow && spaceAbove > spaceBelow;

      panel.dataset.placement = opensUp ? "above" : "below";
      panel.style.setProperty("--panel-available-height", `${Math.max(0, opensUp ? spaceAbove : spaceBelow)}px`);
    }

    function schedulePlacement() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updatePlacement);
    }

    updatePlacement();
    const observer = new ResizeObserver(schedulePlacement);
    observer.observe(anchor);
    observer.observe(panel);
    window.addEventListener("scroll", schedulePlacement, { capture: true, passive: true });
    window.addEventListener("resize", schedulePlacement);
    viewport?.addEventListener("resize", schedulePlacement);
    viewport?.addEventListener("scroll", schedulePlacement);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedulePlacement, true);
      window.removeEventListener("resize", schedulePlacement);
      viewport?.removeEventListener("resize", schedulePlacement);
      viewport?.removeEventListener("scroll", schedulePlacement);
    };
  }, [mobile, open, resolvedContentRef]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !mobile || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      requestAnimationFrame(() => focusRef.current?.current?.focus({ preventScroll: true }));
    };
  }, [mobile, open]);

  if (!open) return null;
  if (!mobile) return <div id={id} ref={resolvedContentRef} role="dialog" aria-label={label} className={`desktop-popover ${className}`}>{children}</div>;

  return <dialog id={id} ref={dialogRef} aria-label={label} className="mobile-action-sheet" onCancel={(event) => {
    event.preventDefault();
    onClose();
  }} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }}>
    <div className="mobile-action-sheet-handle" aria-hidden="true"><span /></div>
    <div ref={contentRef} className={`mobile-action-sheet-content ${className}`}>{children}</div>
  </dialog>;
}
