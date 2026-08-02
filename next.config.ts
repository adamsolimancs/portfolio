import type { NextConfig } from "next";

const publicSearchHeader = {
  key: "X-Robots-Tag",
  value:
    "all, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
};

const privateSearchHeader = {
  key: "X-Robots-Tag",
  value: "noindex, nofollow",
};

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/",
        headers: [publicSearchHeader],
      },
      {
        source: "/dashboard",
        headers: [privateSearchHeader],
      },
      {
        source: "/sign-in",
        headers: [privateSearchHeader],
      },
      {
        source: "/sign-up",
        headers: [privateSearchHeader],
      },
      {
        source: "/api/:path*",
        headers: [privateSearchHeader],
      },
    ];
  },
};

export default nextConfig;
