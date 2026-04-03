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
  const targetBrightness = 150;
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
          radial-gradient(circle at 16% 10%, rgba(${highlightColor.red}, ${highlightColor.green}, ${highlightColor.blue}, 0.34), transparent 30%),
          radial-gradient(circle at 84% 16%, rgba(${sideGlowColor.red}, ${sideGlowColor.green}, ${sideGlowColor.blue}, 0.28), transparent 28%),
          radial-gradient(circle at 50% 82%, rgba(${shadowColor.red}, ${shadowColor.green}, ${shadowColor.blue}, 0.24), transparent 38%),
          linear-gradient(180deg, rgba(26, 23, 20, 0.7) 0%, rgba(11, 10, 10, 0.88) 40%, rgba(7, 7, 8, 0.98) 100%)
        `,
      }
    : undefined;

  return (
    <div className="relative isolate overflow-hidden">
      {imageUrl ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-6%] -z-10 scale-110 opacity-35 blur-3xl saturate-150"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
      ) : null}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 transition-[background] duration-700 ease-out"
        style={backgroundStyle}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-10%] top-[-8%] h-[42rem] -z-10 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),rgba(255,255,255,0.04)_42%,transparent_72%)] opacity-85 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_22%)] mix-blend-screen opacity-80"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.14)_34%,rgba(0,0,0,0.28)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0),rgba(0,0,0,0.14)_68%,rgba(0,0,0,0.32)_100%)]"
      />
      {children}
    </div>
  );
}
