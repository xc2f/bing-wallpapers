import type { NextConfig } from "next";
import { resolve } from "node:path";

const url = new URL(process.env.BASE_URL || "https://www.bing.com")

const nextConfig: NextConfig = {
  experimental: { globalNotFound: true },
  webpack(config, { dev, webpack }) {
    if (!dev) {
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /^@\/db\/media_contents\.json$/,
        resolve("db/media_contents.runtime.json"),
      ));
    }
    return config;
  },
  images: {
    unoptimized: true,
    qualities: [50, 62, 68, 75],
    remotePatterns: [
      {
        protocol: url.protocol.slice(0, -1) as "http" | "https",
        hostname: url.hostname,
      },
    ],
  },
}

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
