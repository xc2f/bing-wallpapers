/** Angular momentum in degrees/second, integrated independently of frame rate. */
export function createEarthInertia() {
  let longitudeSpeed = 0;
  let latitudeSpeed = 0;
  let lastSample = -Infinity;
  let released = false;
  const reset = () => { longitudeSpeed = latitudeSpeed = 0; released = false; lastSample = -Infinity; };
  return {
    reset,
    record(longitude: number, latitude: number, elapsedMs: number, now: number) {
      if (longitude === 0 && latitude === 0) return;
      const seconds = Math.max(.001, Math.min(.1, elapsedMs / 1000));
      const blend = 1 - Math.exp(-seconds / .018);
      const bounded = (value: number) => Math.max(-360, Math.min(360, value));
      longitudeSpeed += (bounded(longitude / seconds) - longitudeSpeed) * blend;
      latitudeSpeed += (bounded(latitude / seconds) - latitudeSpeed) * blend;
      lastSample = now;
      released = false;
    },
    release(now: number) {
      // Fade launch speed while holding still, rather than cutting it off at 100ms.
      const idle = Math.max(0, now - lastSample - 40);
      const retention = Math.max(0, 1 - idle / 140) ** 2;
      longitudeSpeed *= retention;
      latitudeSpeed *= retention;
      released = true;
    },
    step(seconds: number, latitude: number) {
      if (!released || Math.hypot(longitudeSpeed, latitudeSpeed) < .05) {
        if (released) reset();
        return { longitude: 0, latitude, active: false };
      }
      const decay = Math.exp(-2.4 * Math.max(0, Math.min(.05, seconds)));
      const travel = (1 - decay) / 2.4;
      const longitude = longitudeSpeed * travel;
      const nextLatitude = Math.max(-85, Math.min(85, latitude + latitudeSpeed * travel));
      if (nextLatitude === -85 || nextLatitude === 85) latitudeSpeed = 0;
      longitudeSpeed *= decay;
      latitudeSpeed *= decay;
      return { longitude, latitude: nextLatitude, active: true };
    },
  };
}
