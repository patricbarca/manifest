import { emailEnabled, sendAdminAlert } from "./email";

/**
 * Proveedor sin saldo (fal "Exhausted balance", cuota agotada…): no es culpa
 * del vídeo. En vez de marcarlo como fallido, se deja en cola con
 * waitingFunds y se reintenta solo (queue.retryWaitingFunds) cuando hay saldo.
 */
export function isOutOfFunds(err: unknown): boolean {
  const e = err as { status?: number; body?: { detail?: unknown }; message?: string } | undefined;
  const text = `${e?.message ?? ""} ${JSON.stringify(e?.body ?? "")} ${String(err)}`;
  if (/exhausted balance|insufficient (funds|credits|balance)|out of credits|quota_exceeded|top up your balance/i.test(text)) return true;
  return e?.status === 402;
}

let lastAlert = 0;

/** Aviso al administrador: como mucho uno por hora. Siempre deja una línea clara en los logs. */
export async function reportOutOfFunds(where: string, err: unknown): Promise<void> {
  console.error(`[fondos] proveedor sin saldo (${where}): ${String((err as Error)?.message ?? err).slice(0, 200)}`);
  if (Date.now() - lastAlert < 60 * 60 * 1000) return;
  lastAlert = Date.now();
  const to = process.env.ADMIN_ALERT_EMAIL ?? process.env.CONTACT_EMAIL;
  if (!to || !emailEnabled()) {
    console.error("[fondos] sin ADMIN_ALERT_EMAIL/CONTACT_EMAIL o sin Resend: no se pudo mandar el aviso por email");
    return;
  }
  await sendAdminAlert({
    to,
    subject: "⚠️ fal sin saldo: los vídeos están en espera",
    text: `Un proveedor de IA rechazó una generación por falta de saldo (${where}). Los vídeos quedan en cola y se reintentan solos cada 15 minutos. Recarga en https://fal.ai/dashboard/usage-billing/credits`,
  }).catch((e) => console.error("[fondos] email", e));
}
