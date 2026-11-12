import { db } from "../db/store";
import { FREE_DAILY_CAP, FREE_MANIFESTATIONS, PAYMENTS_ENABLED } from "../pricing";
import { emailEnabled, sendAdminAlert } from "../email";
import type { User } from "../types";

/**
 * PRIMERA ESCENA GRATIS (FREE_MANIFESTATIONS=1)
 *
 * Una por cuenta. El tope diario se cuenta sobre las cuentas que la usaron
 * desde las 00:00 UTC (dato guardado, no en memoria: sobrevive a reinicios y
 * despliegues). Mientras los pagos están apagados todo es gratis y no se
 * marca nada.
 */

/** Le queda su escena gratis (sin mirar el tope del día). */
export function hasFreeScene(user: Pick<User, "freeSceneAt">): boolean {
  return FREE_MANIFESTATIONS && PAYMENTS_ENABLED && !user.freeSceneAt;
}

function startOfUtcDay(now = Date.now()): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Escenas gratis regaladas hoy (UTC) entre todas las cuentas. listUsers solo
 * devuelve cuentas con email: en producción lo son todas las que pueden crear
 * (entran con código por email o Google); sin Supabase, en local, las cuentas
 * anónimas no cuentan para el tope.
 */
export async function freeScenesToday(): Promise<number> {
  const since = startOfUtcDay();
  let n = 0;
  for (const u of await db.listUsers()) if ((u.freeSceneAt ?? 0) >= since) n++;
  return n;
}

let lastCapAlert = 0;

/** Aviso (como mucho uno cada 6 h) de que se llegó al tope del día. */
async function alertCap(): Promise<void> {
  if (Date.now() - lastCapAlert < 6 * 60 * 60 * 1000) return;
  lastCapAlert = Date.now();
  const to = process.env.ADMIN_ALERT_EMAIL ?? process.env.CONTACT_EMAIL;
  if (!to || !emailEnabled()) {
    console.warn(`[gratis] tope diario (${FREE_DAILY_CAP}) alcanzado; sin ADMIN_ALERT_EMAIL/CONTACT_EMAIL o sin Resend para avisar`);
    return;
  }
  await sendAdminAlert({
    to,
    subject: "Escenas gratis: tope diario alcanzado",
    text: `Hoy ya se regalaron ${FREE_DAILY_CAP} escenas gratis (FREE_DAILY_CAP). Hasta las 00:00 UTC, quien no tenga manifestaciones verá los paquetes de pago. Sube FREE_DAILY_CAP si quieres regalar más.`,
  }).catch((e) => console.error("[gratis] email", e));
}

/**
 * Intenta gastar la escena gratis de esta persona. Devuelve true si se la
 * concede (y ya queda marcada como usada).
 */
export async function claimFreeScene(user: User): Promise<boolean> {
  if (!hasFreeScene(user)) return false;
  if ((await freeScenesToday()) >= FREE_DAILY_CAP) {
    await alertCap();
    return false;
  }
  await db.putUser({ ...user, freeSceneAt: Date.now() });
  return true;
}

/** Si su escena gratis falló, se la devolvemos para que lo intente otra vez. */
export async function refundFreeScene(userId: string): Promise<void> {
  const user = await db.getUser(userId);
  if (user?.freeSceneAt) await db.putUser({ ...user, freeSceneAt: undefined });
}
