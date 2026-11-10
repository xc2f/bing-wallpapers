/** A repeatable visual star field, with a faint tilted band rather than a uniform grid. */
export function createStarfield(count = 18000) {
  let seed = 74219;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const tilt = .95;
  const palette = [[.78, .87, 1], [.92, .95, 1], [1, .97, .9], [1, .86, .69]];
  for (let i = 0; i < count; i++) {
    const band = random() < .48;
    const longitude = random() * Math.PI * 2;
    const gaussian = Math.sqrt(-2 * Math.log(Math.max(random(), 1e-8))) * Math.cos(random() * Math.PI * 2);
    const latitude = band
      ? Math.max(-1.45, Math.min(1.45, gaussian * (.055 + .06 * (1 + Math.sin(longitude * 3)))))
      : Math.asin(random() * 2 - 1);
    const x = Math.cos(latitude) * Math.cos(longitude);
    const y = Math.sin(latitude);
    const z = Math.cos(latitude) * Math.sin(longitude);
    positions.set([x * 40, (y * Math.cos(tilt) - z * Math.sin(tilt)) * 40, (y * Math.sin(tilt) + z * Math.cos(tilt)) * 40], i * 3);
    const luminosity = Math.pow(random(), 6);
    const brightness = (band ? .09 : .15) + luminosity * 1.15;
    const tint = random();
    const color = palette[tint < .12 ? 0 : tint < .65 ? 1 : tint < .95 ? 2 : 3];
    colors.set(color.map(channel => channel * brightness), i * 3);
    sizes[i] = .8 + Math.sqrt(luminosity) * 2.1;
  }
  return { positions, colors, sizes };
}
