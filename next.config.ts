import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `next build` emits plain static files into ./out.
  // The root /api directory remains plain Vercel serverless functions
  // (deployed via vercel.json, independent of Next).
  output: "export",
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
