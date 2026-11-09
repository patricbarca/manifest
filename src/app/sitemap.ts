import type { MetadataRoute } from "next";
import { POSTS, SITE_URL } from "@/lib/blog";
import { TEMPLATES } from "@/lib/templates";

// Se genera en cada petición: SITE_URL llega en tiempo de ejecución, no al compilar.
export const dynamic = "force-dynamic";

const PAGES_UPDATED = "2026-10-29";

/** Mapa del sitio: solo páginas públicas e indexables. */
export default function sitemap(): MetadataRoute.Sitemap {
  // Fecha real del último cambio de esas páginas. Si cada lectura dijera
  // "hoy", Google dejaría de fiarse del lastmod. Actualízala al cambiarlas.
  const now = new Date(PAGES_UPDATED);
  const pages = ["", "/market", "/pricing", "/blog", "/privacy", "/terms", "/refunds"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
  const posts = POSTS.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
    alternates: p.translation
      ? { languages: { [p.locale]: `${SITE_URL}/blog/${p.slug}`, [p.locale === "es" ? "en" : "es"]: `${SITE_URL}/blog/${p.translation}` } }
      : undefined,
  }));
  const templates = TEMPLATES.map((tpl) => ({
    url: `${SITE_URL}/market/${tpl.slug}`,
    lastModified: new Date(tpl.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...pages, ...posts, ...templates];
}
