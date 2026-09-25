/**
 * Idioma de la interfaz.
 *
 * Se guarda en una cookie, no en la URL. La alternativa canónica son segmentos
 * de ruta (`/en/precios`, `/es/precios`), que es mejor para SEO porque cada
 * idioma tiene su URL indexable — pero obliga a reescribir todos los enlaces y
 * a duplicar el árbol de rutas.
 *
 * Para este producto el tráfico inicial viene de redes y anuncios, no de
 * búsqueda orgánica, así que la cookie basta. Si algún día el SEO importa, el
 * cambio está contenido: `getLocale()` es el único sitio que decide.
 */
export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

/** Inglés por defecto: es el mercado más grande y el que no da por supuesto. */
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "manifest_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
