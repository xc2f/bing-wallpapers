import coordinates from "@/lib/country-coordinates.json";

export interface EarthInitialView { lon: number; lat: number; distance: number }

const countryPoints: Record<string, number[]> = {
  ...coordinates,
  HK: [114.16, 22.32],
  MO: [113.54, 22.2],
};

export function earthInitialView(country?: string | null): EarthInitialView {
  const code = country?.trim().toUpperCase() ?? "";
  const point = /^[A-Z]{2}$/.test(code) ? countryPoints[code] : undefined;
  return point
    ? { lon: point[0], lat: Math.max(-85, Math.min(85, point[1])), distance: 3.1 }
    : { lon: 105, lat: 22, distance: 3.1 };
}
