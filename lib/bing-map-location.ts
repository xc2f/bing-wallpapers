export type MapPoint = [longitude: number, latitude: number];

export type MapLocation = { point: MapPoint; label?: string };

export type ArchiveMapLocation = { longitude: number; latitude: number; label?: string | null };

export function normalizeArchiveMapLocation(value?: ArchiveMapLocation | null): MapLocation | undefined {
  if (!value) return;
  const { longitude, latitude, label } = value;
  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
      !Number.isFinite(latitude) || Math.abs(latitude) > 90) return;
  return { point: [longitude, latitude], label: label?.trim() || undefined };
}

export function parseBingMapLocation(value?: string): MapLocation | undefined {
  if (!value) return;
  let url: URL;
  try {
    url = new URL(value, "https://platform.bing.com");
  } catch {
    return;
  }

  if (url.origin !== "https://platform.bing.com") return;
  const match = url.pathname.match(
    /^\/geo\/REST\/v1\/Imagery\/Map\/[a-z]+\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\/\d+\/?$/i,
  );
  if (!match) return;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
    const pin = url.searchParams.get("pp")?.match(/^([^;]+);[^;]*;(.+)$/);
    const label = pin?.[1] === `${match[1]},${match[2]}` ? pin[2].trim() : undefined;
    return { point: [longitude, latitude], label: label || undefined };
  }
}

export function localizeBingMapLabel(label?: string, sourceTitle?: string, localizedTitle?: string) {
  if (!label || !sourceTitle || !localizedTitle) return;

  const labelParts = label.split(/[,，、]/);
  const sourceParts = sourceTitle.split(/[,，、]/);
  const localizedParts = [...localizedTitle.matchAll(/[^,，、]+/g)];

  if (sourceParts.length < labelParts.length) return;
  const sourceLocation = sourceParts.slice(-labelParts.length);
  const sameStart = sourceLocation[0].trim() === labelParts[0].trim();
  const attachedToSubject = sourceLocation[0].trim().endsWith(` ${labelParts[0].trim()}`);
  if (!sameStart && !attachedToSubject) return;
  if (!sourceLocation.slice(1).every((part, index) => part.trim() === labelParts[index + 1].trim())) return;

  // A translated title may split the subject from the first place name.
  const expectedParts = sourceParts.length + (attachedToSubject ? 1 : 0);
  if (localizedParts.length !== expectedParts || expectedParts <= labelParts.length) return;

  const start = localizedParts[localizedParts.length - labelParts.length].index;
  return localizedTitle.slice(start).trim();
}
