import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/blog";

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
