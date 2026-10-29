import type { Metadata } from "next";
import { SITE_URL } from "@/lib/blog";

export const SITE_NAME = "ManifestLifeAI";
const DEFAULT_OG_IMAGE = { url: "/opengraph-image.png", width: 1200, height: 630, alt: "ManifestLifeAI" };

/**
 * Metadatos de una página pública: canonical, Open Graph y Twitter.
 * Next reemplaza (no fusiona) openGraph y twitter del layout cuando una página
 * los define, así que aquí se repiten siteName y la tarjeta grande.
 */
export function pageMeta({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  // Sin imagen propia se usa la de la web (app/opengraph-image.png). Hay que
  // nombrarla: al redefinir openGraph, Next ya no la hereda del layout.
  const images = [image ?? DEFAULT_OG_IMAGE];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, url: path, title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

/** Recorta a ~155 caracteres sin cortar palabras (lo que muestra Google). */
export function clip(text: string, max = 155): string {
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(" ", max - 1)).replace(/[,.;:]$/, "") + "…";
}

/** JSON-LD de la portada: quién somos y qué web es. */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#web`,
        name: SITE_NAME,
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#org` },
      },
    ],
  };
}
