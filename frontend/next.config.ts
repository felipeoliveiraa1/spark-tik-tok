import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

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

// next-intl em modo no-routing: nao usamos middleware do next-intl (evita
// conflito com proxy.ts). getRequestConfig em i18n/request.ts resolve o
// locale lendo cookie + accept-language a cada request.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: path.join(__dirname, "../"),
};

export default withNextIntl(nextConfig);
