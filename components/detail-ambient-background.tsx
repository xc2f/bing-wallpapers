"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

interface DetailAmbientBackgroundProps {
  children: ReactNode;
  imageUrl?: string;
}

interface AmbientColor {
  red: number;
  green: number;
  blue: number;
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function normalizeAmbientColor(color: AmbientColor) {
  const brightness = (color.red * 299 + color.green * 587 + color.blue * 114) / 1000;
  const targetBrightness = 128;
  const multiplier = brightness > 0 ? targetBrightness / brightness : 1;

  return {
    red: clampChannel(color.red * multiplier),
    green: clampChannel(color.green * multiplier),
    blue: clampChannel(color.blue * multiplier),
  };
}

function shiftAmbientColor(color: AmbientColor, redShift: number, greenShift: number, blueShift: number) {
  return {
    red: clampChannel(color.red + redShift),
    green: clampChannel(color.green + greenShift),
    blue: clampChannel(color.blue + blueShift),
  };
}

export default function DetailAmbientBackground({
  children,
  imageUrl,
}: DetailAmbientBackgroundProps) {
  const [ambientColor, setAmbientColor] = useState<AmbientColor | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setAmbientColor(null);
      return;
    }

    let cancelled = false;
    const image = new Image();

    image.decoding = "async";
    image.referrerPolicy = "same-origin";

    image.onload = () => {
      if (cancelled) {
        return;
      }

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (!context) {
        setAmbientColor(null);
        return;
      }

      const sampleWidth = 32;
      const sampleHeight = 32;

      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

      const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
      let red = 0;
      let green = 0;
      let blue = 0;
      let totalWeight = 0;

      for (let index = 0; index < data.length; index += 4) {
        const alpha = data[index + 3] / 255;
        if (alpha <= 0) {
          continue;
        }

        const pixelRed = data[index];
        const pixelGreen = data[index + 1];
        const pixelBlue = data[index + 2];
        const luminance = (pixelRed * 299 + pixelGreen * 587 + pixelBlue * 114) / 1000;
        const weight = alpha * (0.35 + luminance / 255);

        red += pixelRed * weight;
        green += pixelGreen * weight;
        blue += pixelBlue * weight;
        totalWeight += weight;
      }

      if (!totalWeight) {
        setAmbientColor(null);
        return;
      }

      setAmbientColor(
        normalizeAmbientColor({
          red: red / totalWeight,
          green: green / totalWeight,
          blue: blue / totalWeight,
        })
      );
    };

    image.onerror = () => {
      if (!cancelled) {
        setAmbientColor(null);
      }
    };

    image.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const highlightColor = ambientColor
    ? shiftAmbientColor(ambientColor, 18, 6, -10)
    : null;
  const sideGlowColor = ambientColor
    ? shiftAmbientColor(ambientColor, -6, 12, 18)
    : null;
  const shadowColor = ambientColor
    ? shiftAmbientColor(ambientColor, -34, -16, 8)
    : null;

  const backgroundStyle = ambientColor && highlightColor && sideGlowColor && shadowColor
    ? {
        background: `
          radial-gradient(circle at 14% 10%, rgba(${highlightColor.red}, ${highlightColor.green}, ${highlightColor.blue}, 0.18), transparent 26%),
          radial-gradient(circle at 88% 18%, rgba(${sideGlowColor.red}, ${sideGlowColor.green}, ${sideGlowColor.blue}, 0.14), transparent 24%),
          radial-gradient(circle at 52% 82%, rgba(${shadowColor.red}, ${shadowColor.green}, ${shadowColor.blue}, 0.18), transparent 34%),
          linear-gradient(180deg, rgba(20, 18, 17, 0.82) 0%, rgba(10, 10, 10, 0.95) 42%, rgba(7, 7, 8, 1) 100%)
        `,
      }
    : undefined;

  return (
    <div className="relative isolate">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 transition-[background] duration-700 ease-out"
        style={backgroundStyle}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.035),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_20%)] mix-blend-screen opacity-55"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.26)_34%,rgba(0,0,0,0.42)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0),rgba(0,0,0,0.24)_68%,rgba(0,0,0,0.42)_100%)]"
      />
      {children}
    </div>
  );
}
