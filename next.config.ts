import type { NextConfig } from "next";

const url = new URL(process.env.BASE_URL || "https://www.bing.com")

const nextConfig: NextConfig = {
  images: {
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
