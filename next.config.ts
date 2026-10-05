import type { NextConfig } from "next";

const config: NextConfig = {
  // sharp and PGlite are native/wasm server packages; keep them out of the bundle.
  serverExternalPackages: ["sharp", "@electric-sql/pglite"],
  poweredByHeader: false,
};

export default config;
