import type { NextConfig } from "next";

/** Cabeceras de seguridad para todas las respuestas. */
const securityHeaders = [
  // Solo HTTPS durante un año (también subdominios).
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Nadie puede meter la web en un iframe (evita clickjacking en ajustes y pagos).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Cámara solo para esta web: el escáner de cara de las selfies la abre en el navegador.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  /*
    Empaqueta en .next/standalone solo lo que hace falta para correr, con su
    propio server.js. Es lo que hace que la imagen de Docker no tenga que
    llevar node_modules entero: ~1,2 GB contra unos 200 MB.
  */
  output: "standalone",
  // Sin dominios remotos: el optimizador de imágenes no debe descargar URLs ajenas (era un proxy abierto).
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  // Las direcciones pasaron a inglés: las antiguas redirigen para siempre (308).
  async redirects() {
    const moved: [string, string][] = [
      ["/perfil/editar", "/profile/edit"],
      ["/perfil", "/profile"],
      ["/precios", "/pricing"],
      ["/biblioteca", "/library"],
      ["/privacidad", "/privacy"],
      ["/terminos", "/terms"],
      ["/reembolsos", "/refunds"],
      ["/crear", "/create"],
      ["/entrar", "/login"],
      ["/manifestar", "/new"],
      ["/mi-video", "/my-video"],
      ["/auth/salir", "/auth/logout"],
    ];
    return moved.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
