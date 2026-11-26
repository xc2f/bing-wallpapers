/** Top-left, top-right, bottom-right, bottom-left. */
export type CornerRadii = [number, number, number, number];

export type ImageTransitionRect = { left: number; top: number; width: number; height: number };

export type ImageTransitionOrigin = ImageTransitionRect & { src: string; radius?: number | CornerRadii };

type KeyframeRect = ImageTransitionRect & { radius: CornerRadii };

const duration = 620;
const settleDuration = 180;

function corners(radius: number | CornerRadii | undefined, fallback: number): CornerRadii {
  if (typeof radius === "number") return [radius, radius, radius, radius];
  return radius ?? [fallback, fallback, fallback, fallback];
}

function radiusCss([topLeft, topRight, bottomRight, bottomLeft]: CornerRadii) {
  return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
}

function keyframe({ left, top, width, height, radius }: KeyframeRect): Keyframe {
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    borderRadius: radiusCss(radius),
  };
}

export function rectsMatch(a: ImageTransitionRect, b: ImageTransitionRect, tolerance = 0.5) {
  return Math.abs(a.left - b.left) <= tolerance
    && Math.abs(a.top - b.top) <= tolerance
    && Math.abs(a.width - b.width) <= tolerance
    && Math.abs(a.height - b.height) <= tolerance;
}

const flush = (a: number, b: number) => Math.abs(a - b) <= 1.5;
const pixels = (value: string) => {
  const radius = Number.parseFloat(value);
  return Number.isFinite(radius) ? radius : 0;
};

/** Per-corner radius the image actually shows once its clipping ancestors apply. */
export function clippedCornerRadii(element: HTMLElement): CornerRadii {
  const rect = element.getBoundingClientRect();
  let node = element.parentElement;
  for (let depth = 0; node && depth < 4; depth += 1) {
    const style = window.getComputedStyle(node);
    if (!/(hidden|clip)/.test(`${style.overflowX}${style.overflowY}`)) {
      node = node.parentElement;
      continue;
    }
    const box = node.getBoundingClientRect();
    const top = flush(rect.top, box.top);
    const bottom = flush(rect.bottom, box.bottom);
    const left = flush(rect.left, box.left);
    const right = flush(rect.right, box.right);
    return [
      top && left ? pixels(style.borderTopLeftRadius) : 0,
      top && right ? pixels(style.borderTopRightRadius) : 0,
      bottom && right ? pixels(style.borderBottomRightRadius) : 0,
      bottom && left ? pixels(style.borderBottomLeftRadius) : 0,
    ];
  }
  return [0, 0, 0, 0];
}

/**
 * Flies a copy of the origin image from its previous screen position into the
 * target element. The copy is only used when it can paint on the first frame,
 * so the destination image never shows at its final size before the flight and
 * never blinks out while the copy loads.
 */
export function animateSharedImage(
  target: HTMLImageElement,
  origin: ImageTransitionOrigin,
  { targetRadius }: { targetRadius?: number | CornerRadii } = {},
): () => void {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }
  const destination = target.getBoundingClientRect();
  if (!destination.width || !destination.height) return () => {};

  const from: KeyframeRect = {
    left: origin.left, top: origin.top, width: origin.width, height: origin.height, radius: corners(origin.radius, 9),
  };
  let to: KeyframeRect = {
    left: destination.left, top: destination.top, width: destination.width, height: destination.height, radius: corners(targetRadius, 0),
  };

  const overlay = document.createElement("img");
  overlay.decoding = "sync";
  overlay.alt = "";
  overlay.setAttribute("aria-hidden", "true");
  Object.assign(overlay.style, {
    position: "fixed",
    zIndex: "9999",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    objectFit: "contain",
    borderRadius: radiusCss(from.radius),
    pointerEvents: "none",
    willChange: "left, top, width, height, border-radius",
    boxShadow: "0 20px 70px rgba(0,0,0,.35)",
  });
  overlay.src = origin.src;
  document.body.append(overlay);
  if (!overlay.complete || !overlay.naturalWidth) {
    // Without a ready copy the flight would blink, so keep the static image.
    overlay.remove();
    return () => {};
  }

  const previousVisibility = target.style.visibility;
  target.style.visibility = "hidden";

  let animation: Animation | null = null;
  let disposed = false;
  let corrected = false;
  let stopWaiting = () => {};

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    stopWaiting();
    if (animation) {
      animation.onfinish = null;
      animation.cancel();
      animation = null;
    }
    overlay.remove();
    target.style.visibility = previousVisibility;
  };

  const reveal = () => {
    if (disposed) return;
    if (target.complete) {
      dispose();
      return;
    }
    // Keep the copy in place until the real image can be shown without a gap.
    let timer = 0;
    const done = () => {
      clearTimeout(timer);
      target.removeEventListener("load", done);
      target.removeEventListener("error", done);
      stopWaiting = () => {};
      dispose();
    };
    target.addEventListener("load", done);
    target.addEventListener("error", done);
    timer = window.setTimeout(done, 1000);
    stopWaiting = () => {
      clearTimeout(timer);
      target.removeEventListener("load", done);
      target.removeEventListener("error", done);
    };
  };

  const play = (fromRect: KeyframeRect, toRect: KeyframeRect, ms: number, onDone: () => void) => {
    animation = overlay.animate([keyframe(fromRect), keyframe(toRect)], {
      duration: ms,
      easing: "cubic-bezier(.22,1,.36,1)",
      fill: "forwards",
    });
    animation.onfinish = onDone;
  };

  const settle = () => {
    if (disposed) return;
    animation = null;
    const current = target.getBoundingClientRect();
    if (!corrected && current.width && current.height && !rectsMatch(current, to)) {
      corrected = true;
      const previous = to;
      to = { left: current.left, top: current.top, width: current.width, height: current.height, radius: previous.radius };
      play(previous, to, settleDuration, settle);
      return;
    }
    reveal();
  };

  play(from, to, duration, settle);

  return dispose;
}
