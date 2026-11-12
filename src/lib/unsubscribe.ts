import { createHmac, timingSafeEqual } from "node:crypto";
import { appBase } from "./hosts";

/**
 * Enlace de baja de los emails de novedades: funciona con un clic, sin
 * iniciar sesión. Va firmado para que nadie dé de baja a otra persona.
 * Clave: EMAIL_LINK_SECRET (o, si no está, la de Resend, que existe siempre
 * que se mandan emails).
 */
function secret(): string {
  return process.env.EMAIL_LINK_SECRET || process.env.RESEND_API_KEY || "";
}

function sign(userId: string): string {
  return createHmac("sha256", secret()).update(`unsub:${userId}`).digest("base64url").slice(0, 32);
}

export function verifyUnsubscribe(userId: string, token: string): boolean {
  if (!secret() || !userId || !token) return false;
  const a = Buffer.from(sign(userId));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** URL completa para el pie del email y la cabecera List-Unsubscribe. */
export function unsubscribeUrl(userId: string): string {
  return `${appBase()}/api/unsubscribe?u=${encodeURIComponent(userId)}&t=${sign(userId)}`;
}
