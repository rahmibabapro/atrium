import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ["better-sqlite3", "mysql2"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "atrium.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/lore", destination: "/wiki", permanent: false },
      { source: "/lore/", destination: "/wiki", permanent: false },
      { source: "/pages/home", destination: "/", permanent: false },
      { source: "/pages/home/", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
