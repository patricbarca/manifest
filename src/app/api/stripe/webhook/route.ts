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
      metadata?: { projectId?: string };
    };
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
            url: `${process.env.SITE_URL ?? ""}/video/${id}`,
          });
        }
      }
    }
  }
  return NextResponse.json({ received: true });
}
