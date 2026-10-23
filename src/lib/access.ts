import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isDemoMode } from "./ai";

/**
 * Beta privada.
 *
 * Con proveedores reales cada vídeo cuesta dinero de verdad y todavía no hay
 * pagos, así que crear vídeos exige haber entrado por el enlace de invitación
 * (/api/access?code=…). Si ACCESS_CODE no está definida, o la app está en
 * modo demo, no hay puerta.
 */

export const ACCESS_COOKIE = "ml_access";

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function accessCodeMatches(code: string | null | undefined): boolean {
  const expected = process.env.ACCESS_CODE;
  return !!expected && !!code && same(code, expected);
}

export async function hasAccess(): Promise<boolean> {
  if (!process.env.ACCESS_CODE || isDemoMode()) return true;
  const jar = await cookies();
  return accessCodeMatches(jar.get(ACCESS_COOKIE)?.value);
}
