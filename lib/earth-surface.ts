import type { Texture, TextureLoader } from "three";

export const EARTH_PREVIEW_TEXTURE = "/maps/earth-day-preview.jpg";

/** Display a small surface first; optional improvements never gate the globe. */
export function loadEarthSurface(
  loader: Pick<TextureLoader, "load">,
  fullPath: string,
  callbacks: { onSurface: (texture: Texture) => void; onUpgrade: (texture: Texture) => void; onEnhance: () => void; onError: () => void },
) {
  const textures = new Set<Texture>();
  let disposed = false;
  let enhancement: ReturnType<typeof setTimeout> | undefined;
  function load(path: string, first: boolean): Texture {
    const texture = loader.load(path, loaded => {
      if (disposed) { loaded.dispose(); return; }
      if (first) {
        callbacks.onSurface(loaded);
        enhancement = setTimeout(() => {
          if (disposed) return;
          if (path !== fullPath) load(fullPath, false);
          callbacks.onEnhance();
        }, 650);
      } else callbacks.onUpgrade(loaded);
    }, undefined, () => {
      if (disposed) return;
      if (path === EARTH_PREVIEW_TEXTURE) load(fullPath, true);
      else if (first) callbacks.onError();
      // A failed high-resolution upgrade keeps the preview usable.
    });
    textures.add(texture);
    return texture;
  }
  return {
    texture: load(EARTH_PREVIEW_TEXTURE, true),
    dispose() {
      disposed = true;
      clearTimeout(enhancement);
      for (const texture of textures) texture.dispose();
    },
  };
}
