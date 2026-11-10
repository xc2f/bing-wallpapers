/** Decorative screen positions, separate from the globe's geographic markers. */
export function spaceOrbitLayout(width: number, height: number, distance: number) {
  const compact = width <= 640;
  const cardWidth = compact ? 64 : 88;
  const cardHeight = compact ? 70 : 84;
  const cameraDistance = distance * Math.max(1, height / width);
  const radius = height / (2 * Math.tan(19 * Math.PI / 180) * Math.sqrt(cameraDistance ** 2 - 1));
  const progress = Math.max(0, Math.min(1, (distance - 3.4) / .9));
  const opacity = progress * progress * (3 - 2 * progress);
  const orbit = radius + (compact ? 96 : 164);
  const side = Math.min(width * .27, 110);
  const rise = Math.sqrt(Math.max(0, orbit ** 2 - side ** 2));
  const centers = compact
    ? [[width / 2 - side, height / 2 - rise], [width / 2 + side, height / 2 - rise], [width / 2, height / 2 + orbit]]
    : [-145, -25, 140].map(angle => [width / 2 + Math.cos(angle * Math.PI / 180) * orbit, height / 2 + Math.sin(angle * Math.PI / 180) * orbit]);
  return centers.map(([cx, cy]) => {
    const x = Math.max(16, Math.min(width - cardWidth - 16, cx - cardWidth / 2));
    const y = Math.max(92, Math.min(height - cardHeight - 20, cy - cardHeight / 2));
    const dx = Math.max(0, Math.abs(x + cardWidth / 2 - width / 2) - cardWidth / 2);
    const dy = Math.max(0, Math.abs(y + cardHeight / 2 - height / 2) - cardHeight / 2);
    return { x, y, width: cardWidth, height: cardHeight, opacity: Math.hypot(dx, dy) > radius + 12 ? opacity : 0 };
  });
}
