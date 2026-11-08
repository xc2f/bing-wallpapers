"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

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
  const focusRef = useRef(returnFocusRef);
  focusRef.current = returnFocusRef;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

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
  if (!mobile) return <div id={id} ref={contentRef} role="dialog" aria-label={label} className={className}>{children}</div>;

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
