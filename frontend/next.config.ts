import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/execute',
        destination: 'http://localhost:3000/execute',
      },
    ];
  },
};

export default nextConfig;
