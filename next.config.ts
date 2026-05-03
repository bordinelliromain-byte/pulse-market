import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'whatmarket.fr' }],
        destination: '/whatmarket',
        permanent: false,
      },
      {
        source: '/',
        has: [{ type: 'host', value: 'www.whatmarket.fr' }],
        destination: '/whatmarket',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;