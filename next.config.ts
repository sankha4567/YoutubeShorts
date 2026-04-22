import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["dreamily-soundable-kori.ngrok-free.dev"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
};

export default nextConfig;
