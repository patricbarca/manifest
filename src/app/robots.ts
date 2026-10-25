import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/blog";

// Se genera en cada petición: SITE_URL llega en tiempo de ejecución, no al compilar.
export const dynamic = "force-dynamic";

/** Se indexa lo público; lo privado de cada usuario, no. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/biblioteca", "/crear", "/video/", "/entrar", "/auth/", "/media/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
