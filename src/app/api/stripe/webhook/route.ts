import { appBase } from "@/lib/hosts";
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
      metadata?: { projectId?: string; kind?: string; userId?: string; qty?: string };
    };
    // Paquete de manifestaciones: suma créditos una sola vez por sesión.
    if (session.metadata?.kind === "credits" && session.payment_status === "paid" && session.metadata.userId) {
      const user = await db.getUser(session.metadata.userId);
      const qty = Math.max(0, Math.min(100, Number(session.metadata.qty) || 0));
      if (user && qty && !(user.creditSessions ?? []).includes(session.id)) {
        await db.putUser({ ...user, credits: (user.credits ?? 0) + qty, creditSessions: [...(user.creditSessions ?? []), session.id].slice(-50) });
      }
      return NextResponse.json({ received: true });
    }
    const id = session.metadata?.projectId;
    if (id && session.payment_status === "paid") {
      // Solo una vez: Stripe puede reenviar el mismo evento.
      let start = false;
      await db.patchProject(id, (p) => {
        if (p.status !== "draft") return p;
        start = true;
        return { ...p, status: "queued", paidCents: session.amount_total ?? p.paidCents, stripeSessionId: session.id };
      });
      if (start) {
        enqueue(id);
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
