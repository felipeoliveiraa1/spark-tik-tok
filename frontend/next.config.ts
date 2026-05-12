import type { NextConfig } from "next";
import path from "node:path";

// Next.js 16 + Turbopack inside a pnpm workspace needs the root set to this
// package's directory or it walks up and gets confused. Using __dirname keeps
// the path tied to where this file actually lives.
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: path.join(__dirname, "../"),
};

export default nextConfig;
