import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "placehold.co",
        protocol: "https",
      },
      {
        hostname: "rggqkrqjqtjzwslgvfgq.supabase.co",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
