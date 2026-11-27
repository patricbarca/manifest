/**
 * Dos direcciones, un solo servidor:
 * - SITE_URL (manifestlife.ai): la web pública — portada, precios, blog.
 * - APP_URL (app.manifestlife.ai): la app — perfil, feed, crear, vídeos.
 * Sin APP_URL todo vive en SITE_URL, como antes.
 */

function hostOf(url: string | undefined): string | null {
  try {
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
}

export const appHost = () => hostOf(process.env.APP_URL);
export const siteHost = () => hostOf(process.env.SITE_URL);

/** Base para enlaces absolutos a la app (emails, recordatorios, Stripe). */
export function appBase(): string {
  return (process.env.APP_URL ?? process.env.SITE_URL ?? "").replace(/\/$/, "");
}

/** Base para enlaces a la web pública desde la app. */
export function siteBase(): string {
  return (process.env.APP_URL ? process.env.SITE_URL ?? "" : "").replace(/\/$/, "");
}

/** Páginas que solo existen en la web pública (desde la app se redirigen allí). */
export const SITE_ONLY = ["/pricing", "/blog", "/start"];
/** Páginas de la app (desde la web pública se redirigen a la app). */
export const APP_ONLY = ["/profile", "/feed", "/create", "/new", "/my-video", "/video", "/login", "/library", "/settings", "/search", "/admin"];

export const matches = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(`${p}/`));

/**
 * Enlace a una página de la app desde la web pública: absoluto (app.manifestlife.ai/…).
 * Con un enlace relativo, Next intenta cargarla sin recargar, el servidor la redirige a
 * otro dominio, el navegador lo bloquea y acaba recargando: ~1,5 s perdidos en el botón.
 */
export function appHref(path: string): string {
  return process.env.APP_URL && matches(path.split("?")[0], APP_ONLY) ? `${appBase()}${path}` : path;
}

/** ¿Esta petición entró por la dirección de la app? (cabeceras del proxy de Railway). */
export function isAppHostHeader(hostHeader: string | null | undefined): boolean {
  const app = appHost();
  const host = hostHeader?.split(",")[0].trim().split(":")[0].toLowerCase();
  return !!app && host === app;
}
