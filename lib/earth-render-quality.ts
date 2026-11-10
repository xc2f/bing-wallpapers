/** Bound fragment work on large/high-DPI screens without reducing map resolution. */
export function earthRenderQuality(width: number, height: number, devicePixelRatio: number) {
  const area = Math.max(1, width) * Math.max(1, height);
  const requested = Math.min(2, Math.max(1, devicePixelRatio || 1));
  return {
    resting: Math.min(requested, Math.sqrt(4_000_000 / area)),
    interacting: Math.min(requested, 1.25, Math.sqrt(2_000_000 / area)),
  };
}
