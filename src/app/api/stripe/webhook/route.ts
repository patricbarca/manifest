import { appBase } from "@/lib/hosts";
import { packGrant } from "@/lib/pricing";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import type { User } from "@/lib/types";
import { enqueue } from "@/lib/queue";
import { verifyWebhook } from "@/lib/stripe";
import { sendCheckoutReminder, sendOrderConfirmation } from "@/lib/email";

export const runtime = "nodejs";

/** Stripe avisa aquí cuando se completa un pago: se arranca el vídeo pagado. */
export async function POST(request: Request) {
  const payload = await request.text();
  const event = verifyWebhook(payload, request.headers.get("stripe-signature"));
  if (!event) return NextResponse.json({ error: "bad signature" }, { status: 400 });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      payment_status?: string;
      amount_total?: number;
      currency?: string;
      metadata?: { projectId?: string; kind?: string; userId?: string; qty?: string; upsell?: string };
    };
    // Paquete de manifestaciones: suma créditos una sola vez por sesión.
    const kind = session.metadata?.kind;
    // Pagado, o gratis con un código de descuento del 100 % (Stripe no cobra nada en ese caso).
    const settled = session.payment_status === "paid" || (session.payment_status === "no_payment_required" && session.amount_total === 0);
    if ((kind === "credits" || kind === "stills" || kind === "elevated") && settled && session.metadata?.userId) {
      const user = await db.getUser(session.metadata.userId);
      const qty = Math.max(0, Math.min(100, Number(session.metadata.qty) || 0));
      const { field, n } = packGrant(kind === "credits" ? "wishes" : kind, qty);
      if (user && qty && !(user.creditSessions ?? []).includes(session.id)) {
        await db.putUser({ ...user, [field]: (user[field] ?? 0) + n, ...(session.metadata.upsell === "1" ? { upsellUsed: true } : {}), creditSessions: [...(user.creditSessions ?? []), session.id].slice(-50) });
      }
      return NextResponse.json({ received: true });
    }
    const id = session.metadata?.projectId;
    if (id && settled) {
      // Solo una vez: Stripe puede reenviar el mismo evento.
      let start = false;
      await db.patchProject(id, (p) => {
        if (p.status !== "draft") return p;
        start = true;
        return { ...p, status: "queued", paidCents: session.amount_total ?? p.paidCents, stripeSessionId: session.id };
      });
      if (start) {
        enqueue(id);
        // Lo que sobró del pack (p. ej. 4 de 10 deseos) va al saldo.
        const paid = await db.getProject(id);
        if (paid?.extraGrant) {
          const { field, n } = paid.extraGrant;
          const owner = await db.getUser(paid.ownerId);
          if (owner) await db.putUser({ ...owner, [field]: (owner[field] ?? 0) + n });
        }
        // Recibo con la renuncia al desistimiento (soporte duradero).
        const project = await db.getProject(id);
        const owner = project ? await db.getUser(project.ownerId) : undefined;
        if (project && owner?.email) {
          void sendOrderConfirmation({
            to: owner.email,
            locale: project.locale,
            title: project.script?.title || project.title,
            amountCents: session.amount_total ?? project.paidCents,
            currency: session.currency ?? "usd",
            waiverAt: project.waiverAt,
            url: `${appBase()}/video/${id}`,
          });
        }
      }
    }
  }
  // Pago sin terminar: la sesión caducó (a las 3 h). Un recordatorio por pedido.
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as { id: string; metadata?: { projectId?: string; kind?: string; userId?: string } };
    const projectId = session.metadata?.projectId;
    if (projectId) {
      let remind = false;
      const project = await db.patchProject(projectId, (p) => {
        // Solo si sigue sin pagar y es la última sesión que se abrió para él.
        if (p.status !== "draft" || p.reminderSentAt || p.stripeSessionId !== session.id) return p;
        remind = true;
        return { ...p, reminderSentAt: Date.now() };
      }).catch(() => undefined);
      const owner = project && remind ? await db.getUser(project.ownerId) : undefined;
      if (project && owner && (await claimReminder(owner))) {
        await sendCheckoutReminder({ to: owner.email!, locale: project.locale, what: "video", url: `${appBase()}/video/${project.id}` });
      }
    } else if (session.metadata?.userId) {
      const user = await db.getUser(session.metadata.userId);
      // creditSessions guarda las sesiones ya atendidas: así no se avisa dos veces.
      if (user && !(user.creditSessions ?? []).includes(session.id)) {
        const marked = await db.putUser({ ...user, creditSessions: [...(user.creditSessions ?? []), session.id].slice(-50) });
        if (await claimReminder(marked)) {
          await sendCheckoutReminder({ to: user.email!, locale: user.locale === "es" ? "es" : "en", what: "pack", url: `${appBase()}/new` });
        }
      }
    }
  }
  return NextResponse.json({ received: true });
}

/**
 * Como mucho un recordatorio de pago sin terminar por persona cada 24 h:
 * si abrió varios pagos y no terminó ninguno, recibe un solo email.
 */
async function claimReminder(user: User): Promise<boolean> {
  if (!user.email || user.reminders === false) return false;
  if (user.checkoutReminderAt && Date.now() - user.checkoutReminderAt < 24 * 3600_000) return false;
  await db.putUser({ ...user, checkoutReminderAt: Date.now() });
  return true;
}
