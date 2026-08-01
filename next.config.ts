import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Lint locally in dev; don't let lint warnings block production builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
