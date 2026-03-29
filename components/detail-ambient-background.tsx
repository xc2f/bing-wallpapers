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
    ? shiftAmbientColor(ambientColor, 22, 10, -8)
    : null;
  const shadowColor = ambientColor
    ? shiftAmbientColor(ambientColor, -28, -12, 14)
    : null;

  const backgroundStyle = ambientColor && highlightColor && shadowColor
    ? {
        background: `
          radial-gradient(circle at 12% 10%, rgba(${highlightColor.red}, ${highlightColor.green}, ${highlightColor.blue}, 0.24), transparent 28%),
          radial-gradient(circle at 84% 14%, rgba(${ambientColor.red}, ${ambientColor.green}, ${ambientColor.blue}, 0.18), transparent 24%),
          radial-gradient(circle at 58% 78%, rgba(${shadowColor.red}, ${shadowColor.green}, ${shadowColor.blue}, 0.16), transparent 30%),
          linear-gradient(180deg, rgba(18, 15, 13, 0.88) 0%, rgba(11, 10, 10, 0.96) 45%, rgba(8, 8, 8, 0.99) 100%)
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
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%)] mix-blend-screen opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.18)_36%,rgba(0,0,0,0.32)_100%)]"
      />
      {children}
    </div>
  );
}
