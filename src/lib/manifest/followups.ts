import { appBase } from "../hosts";
import { db } from "../db/store";
import { emailEnabled, sendFreeFollowup } from "../email";
import { hasMarketingConsent } from "../consent";
import { unsubscribeUrl } from "../unsubscribe";
import { manifests } from "./store";

const DAY = 24 * 60 * 60 * 1000;

/** Hora local (0–23) en su zona; si no se sabe, la de UTC. */
function localHour(tz?: string): number {
  try {
    return Number(new Intl.DateTimeFormat("en-US", { timeZone: tz || "UTC", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  } catch {
    return new Date().getUTCHours();
  }
}

/** Ya pagó algo (vídeo completo o paquete): no se le insiste más. */
async function hasPaid(userId: string, creditSessions?: string[]): Promise<boolean> {
  if ((creditSessions?.length ?? 0) > 0) return true;
  return (await db.listProjects(userId)).some((p) => (p.paidCents ?? 0) > 0);
}

/**
 * Se mira cada 15 min. A quien usó su escena gratis, aceptó novedades y aún
 * no ha comprado: día 1 "vuelve a verte", día 3 "tu ritual completo". Solo
 * entre las 10:00 y las 20:00 de su zona, un email por pasada como mucho.
 */
export async function runFreeFollowups(): Promise<void> {
  if (!emailEnabled() || !appBase()) return;
  const site = appBase();
  const now = Date.now();
  for (const user of await db.listUsers()) {
    if (!user.freeSceneAt || !hasMarketingConsent(user)) continue;
    const sent = user.freeFollowups ?? [];
    if (sent.includes(3)) continue;
    const age = now - user.freeSceneAt;
    const day: 1 | 3 | null = age >= 3 * DAY ? 3 : age >= DAY && !sent.includes(1) ? 1 : null;
    if (!day) continue;
    const h = localHour(user.tz);
    if (h < 10 || h >= 20) continue;
    if (await hasPaid(user.id, user.creditSessions)) continue;
    // Solo si su escena gratis llegó a salir.
    if (!(await manifests.list(user.id)).some((m) => m.free && m.status === "ready")) continue;
    const ok = await sendFreeFollowup({
      to: user.email,
      locale: user.locale === "es" ? "es" : "en",
      day,
      sceneUrl: `${site}/profile`,
      createUrl: `${site}/create`,
      unsubscribeUrl: unsubscribeUrl(user.id),
    });
    // El del día 3 cierra la secuencia (si el 1 no llegó a salir, ya no se manda).
    if (ok) {
      const fresh = (await db.getUser(user.id)) ?? user;
      await db.putUser({ ...fresh, freeFollowups: day === 3 ? [1, 3] : [...new Set([...(fresh.freeFollowups ?? []), 1])] });
    }
  }
}
