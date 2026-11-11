import { appBase } from "@/lib/hosts";
import { packGrant } from "@/lib/pricing";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { enqueue } from "@/lib/queue";
import { verifyWebhook } from "@/lib/stripe";
import { sendOrderConfirmation } from "@/lib/email";

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
  return NextResponse.json({ received: true });
}
