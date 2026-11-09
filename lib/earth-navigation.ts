import { MathUtils, PerspectiveCamera, Raycaster, Sphere, Vector2, Vector3 } from "three";

// Keep interactive zoom within the useful detail of the global surface texture.
export const EARTH_MIN_DISTANCE = 2.05;
export const EARTH_MAX_DISTANCE = 5;

export interface EarthZoomAnchor {
  point: Vector3;
  pointer: Vector2;
}

/** Reusable scratch objects keep cursor-anchored zoom out of the allocation hot path. */
export function createEarthZoomNavigation(camera: PerspectiveCamera) {
  const raycaster = new Raycaster();
  const sphere = new Sphere(new Vector3(), 1);

  function capture(pointer: Vector2): EarthZoomAnchor | null {
    const position = pointer.clone();
    // Over space, use the nearest inner part of the visible globe in that direction.
    const distance = camera.position.length();
    if (distance <= 1) return null;
    const radius = 1 / Math.sqrt(distance * distance - 1)
      / Math.tan(MathUtils.degToRad(camera.fov / 2));
    const pointerRadius = Math.hypot(position.x * camera.aspect, position.y);
    if (pointerRadius > radius * .9) position.multiplyScalar(radius * .9 / pointerRadius);
    raycaster.setFromCamera(position, camera);
    const point = raycaster.ray.intersectSphere(sphere, new Vector3());
    return point ? { point, pointer: position } : null;
  }

  function orient(anchor: EarthZoomAnchor, distance: number, longitude: number, latitude: number) {
    const tangent = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const radius = 1 / Math.sqrt(distance * distance - 1) / tangent;
    const pointerRadius = Math.hypot(anchor.pointer.x * camera.aspect, anchor.pointer.y);
    // When zooming out past the limb, slide along its inside rather than fighting
    // an unreachable screen position. This keeps the solution continuous.
    const scale = pointerRadius > 0 ? Math.min(1, radius * .98 / pointerRadius) : 1;
    const x = anchor.pointer.x * scale * camera.aspect * tangent;
    const y = anchor.pointer.y * scale * tangent;
    const rayLength = Math.hypot(x, y, 1);
    const rayX = x / rayLength;
    const rayY = y / rayLength;
    const rayZ = 1 / rayLength;
    const intersection = distance * rayZ - Math.sqrt(Math.max(0, 1 - distance * distance * (1 - rayZ * rayZ)));
    const forward = distance - intersection * rayZ;
    const right = intersection * rayX;
    const up = intersection * rayY;

    // Solve the upright orbit directly in the camera basis; no per-frame
    // numerical iterations or finite-difference corrections are needed.
    const latitudeOffset = Math.atan2(up, forward);
    const latitudeAngle = Math.asin(MathUtils.clamp(anchor.point.y / Math.hypot(forward, up), -1, 1));
    const anchorLongitude = Math.atan2(-anchor.point.z, anchor.point.x);
    const oldLon = MathUtils.degToRad(longitude);
    const oldLat = MathUtils.degToRad(latitude);
    let best = { lon: longitude, lat: latitude };
    let bestDistance = Infinity;
    for (const candidate of [latitudeAngle - latitudeOffset, Math.PI - latitudeAngle - latitudeOffset]) {
      const wrappedLat = Math.atan2(Math.sin(candidate), Math.cos(candidate));
      const lat = MathUtils.clamp(wrappedLat, MathUtils.degToRad(-85), MathUtils.degToRad(85));
      const lon = anchorLongitude - Math.atan2(right, forward * Math.cos(lat) - up * Math.sin(lat));
      const delta = Math.atan2(Math.sin(lon - oldLon), Math.cos(lon - oldLon));
      const alignment = Math.sin(lat) * Math.sin(oldLat) + Math.cos(lat) * Math.cos(oldLat) * Math.cos(delta);
      // Prefer a reachable latitude, then the closest camera orientation.
      const cost = 1 - alignment + Math.abs(wrappedLat - lat) * 10;
      if (cost < bestDistance) {
        bestDistance = cost;
        best = { lon: longitude + MathUtils.radToDeg(delta), lat: MathUtils.radToDeg(lat) };
      }
    }
    return best;
  }

  return { capture, orient };
}
