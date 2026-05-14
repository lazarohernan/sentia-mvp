import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/registro",
        destination: "/login",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
