import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["replicate"],
  experimental: { serverActions: { bodySizeLimit: "30mb" } }
};

export default nextConfig;
