import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduce bundle size by tree-shaking lucide icons
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Enable compression
  compress: true,
  // Faster builds
  reactStrictMode: true,
};

export default nextConfig;
