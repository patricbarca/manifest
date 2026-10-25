/**
 * La dirección pública con la que el visitante entró (www.manifestlife.ai,
 * manifestlife.ai o el dominio de Railway). Detrás del proxy de Railway,
 * request.url trae el host interno; por eso se miran las cabeceras reenviadas.
 */
export function requestOrigin(request: Request): string {
  const h = request.headers;
  const host = h.get("x-forwarded-host")?.split(",")[0].trim() || h.get("host");
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() || "https";
  if (host && /^[a-z0-9.-]+(:\d+)?$/i.test(host)) return `${proto}://${host}`;
  return process.env.SITE_URL ?? new URL(request.url).origin;
}
