import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
    Empaqueta en .next/standalone solo lo que hace falta para correr, con su
    propio server.js. Es lo que hace que la imagen de Docker no tenga que
    llevar node_modules entero: ~1,2 GB contra unos 200 MB.
  */
  output: "standalone",
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default nextConfig;
