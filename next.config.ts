import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow local images with special characters in filenames
    localPatterns: [{ pathname: '/**' }],
  },
};

export default nextConfig;
