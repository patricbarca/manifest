import type { MetadataRoute } from "next";
import { POSTS, SITE_URL } from "@/lib/blog";
import { TEMPLATES } from "@/lib/templates";

/** Mapa del sitio: solo páginas públicas e indexables. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ["", "/market", "/precios", "/blog", "/privacidad", "/terminos", "/reembolsos"].map((path) => ({
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
