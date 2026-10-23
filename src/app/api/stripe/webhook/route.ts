import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { runPipeline } from "@/lib/pipeline";
import { verifyWebhook } from "@/lib/stripe";

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
        void runPipeline(id).catch((err) => console.error("[pipeline]", id, err));
      }
    }
  }
  return NextResponse.json({ received: true });
}
