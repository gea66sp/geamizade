import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', 
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.private.blob.vercel-storage.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com', 
        port: '',
      },
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;