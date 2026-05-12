import type { NextConfig } from "next";
import path from "node:path";

// Next.js 16 + Turbopack in a pnpm workspace.
//
// - `turbopack.root` MUST point at this package so Turbopack stops climbing the
//   tree looking for `next/package.json` (otherwise it sees `frontend/app/`
//   and errors out).
// - `outputFileTracingRoot` MUST point at the workspace root so the file
//   tracer follows hoisted node_modules (`shamefully-hoist=true`).
//
// Next emits a warning that the two values should match — they shouldn't, in
// this layout. Suppressing it cleanly isn't supported yet; harmless.
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: path.join(__dirname, "../"),
};

export default nextConfig;
