import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The floating "N" badge in development reads as part of the page.
  devIndicators: false,
  images: {
    // Real product photography will be served from Supabase Storage once uploaded.
    // Until then the catalogue draws licensed stock photography from Pexels/Pixabay,
    // and the app falls back to the woven placeholder system in `components/ui/media`.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
    ],
    // Images go through the loader in src/lib/image-loader.ts (attached in
    // components/ui/remote-image.tsx), which asks Pexels' own CDN for the
    // exact width rather than proxying through Next's optimiser.
    deviceSizes: [420, 640, 828, 1080, 1200, 1600, 1920, 2560],
  },
  serverExternalPackages: ["firebase-admin"],
  experimental: {
    optimizePackageImports: ["motion"],
    // The seller's product form posts up to 6 images of 5 MB each in one save
    // (see MAX_NEW_IMAGES_PER_SAVE). The default limit is 1 MB.
    serverActions: { bodySizeLimit: "32mb" },
  },
};

export default nextConfig;
