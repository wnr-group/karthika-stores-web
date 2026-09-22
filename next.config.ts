import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Real product photography will be served from Supabase Storage once uploaded.
    // Until then the catalogue draws licensed stock photography from Pexels/Pixabay,
    // and the app falls back to the woven placeholder system in `components/ui/media`.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [420, 640, 828, 1080, 1200, 1600, 1920, 2560],
  },
  serverExternalPackages: ["firebase-admin"],
  experimental: {
    optimizePackageImports: ["motion"],
  },
};

export default nextConfig;
