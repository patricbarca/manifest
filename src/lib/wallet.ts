import { db } from "./db/store";
import type { Manifestation, Tier, User } from "./types";

export type Quality = NonNullable<Manifestation["quality"]>;
type Field = "credits" | "stillCredits";

/** Lo que cuesta cada tipo: animado 1 deseo, Elevated 2 deseos, foto con movimiento 1 still. */
export function costOf(quality: Quality | undefined): { field: Field; n: number } {
  if (quality === "still") return { field: "stillCredits", n: 1 };
  return { field: "credits", n: quality === "elevated" ? 2 : 1 };
}

/** El vídeo completo (3 escenas) pagado con el saldo: Stills 3 stills, Cinematic 3 deseos, Elevated 6. */
export function tierCost(tier: Tier): { field: Field; n: number } {
  if (tier === "vision") return { field: "stillCredits", n: 3 };
  return { field: "credits", n: tier === "elevated" ? 6 : 3 };
}

export const balance = (user: User | undefined | null, field: Field) => user?.[field] ?? 0;

/** Descuenta del saldo si llega. Lee el usuario fresco. False si no le alcanza. */
export async function spend(userId: string, cost: { field: Field; n: number }): Promise<boolean> {
  const user = await db.getUser(userId);
  if (!user || balance(user, cost.field) < cost.n) return false;
  await db.putUser({ ...user, [cost.field]: balance(user, cost.field) - cost.n });
  return true;
}

/** Devuelve al saldo (si algo falló). */
export async function giveBack(userId: string, cost: { field: Field; n: number }): Promise<void> {
  const user = await db.getUser(userId);
  if (user) await db.putUser({ ...user, [cost.field]: balance(user, cost.field) + cost.n });
}

/** Le toca el "completa tu vídeo": tiene 1 o 2 escenas animadas, ningún deseo sin usar y no lo ha usado antes. */
export function upsellEligible(user: User, mine: Manifestation[]): boolean {
  const animated = mine.filter((m) => m.quality !== "still" && m.status !== "failed").length;
  return !user.upsellUsed && balance(user, "credits") === 0 && animated >= 1 && animated < 3;
}
