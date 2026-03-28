import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4.5mb', // Libera o limite até o teto do servidor Vercel
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
    ],
  },
};

export default nextConfig;