import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { enqueue } from "@/lib/queue";
import { getSubscription, verifyWebhook, type StripeSubscription } from "@/lib/stripe";
import { MEMBERSHIP, membershipStatus } from "@/lib/membership";
import type { Membership } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Stripe avisa aquí de:
 *  - checkout.session.completed (pago de un vídeo → arranca; alta de socio → activa)
 *  - customer.subscription.updated / deleted (renovación, impago, cancelación)
 */
export async function POST(request: Request) {
  const payload = await request.text();
  const event = verifyWebhook(payload, request.headers.get("stripe-signature"));
  if (!event) return NextResponse.json({ error: "bad signature" }, { status: 400 });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        id: string;
        mode?: string;
        payment_status?: string;
        amount_total?: number;
        subscription?: string;
        metadata?: { projectId?: string; userId?: string };
      };
      if (session.mode === "subscription" && session.subscription) {
        // Se lee la suscripción entera: el evento de checkout no trae el periodo.
        await syncMembership(await getSubscription(session.subscription), session.metadata?.userId);
      } else {
        await startPaidProject(session);
      }
    } else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncMembership(event.data.object as unknown as StripeSubscription);
    }
  } catch (err) {
    // 500 para que Stripe reintente más tarde.
    console.error("[stripe webhook]", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

async function startPaidProject(session: {
  id: string;
  payment_status?: string;
  amount_total?: number;
  metadata?: { projectId?: string };
}) {
  const id = session.metadata?.projectId;
  if (!id || session.payment_status !== "paid") return;
  // Solo una vez: Stripe puede reenviar el mismo evento.
  let start = false;
  await db.patchProject(id, (p) => {
    if (p.status !== "draft") return p;
    start = true;
    return { ...p, status: "queued", paidCents: session.amount_total ?? p.paidCents, stripeSessionId: session.id };
  });
  if (start) enqueue(id);
}

/**
 * Copia el estado de la suscripción al usuario. Idempotente: el mismo evento
 * dos veces deja lo mismo. Los vídeos incluidos solo se tocan en el alta.
 */
async function syncMembership(sub: StripeSubscription, fallbackUserId?: string) {
  const userId = sub.metadata?.userId ?? fallbackUserId;
  if (!userId) {
    console.warn("[stripe webhook] suscripción sin userId", sub.id);
    return;
  }
  const item = sub.items?.data?.[0];
  const periodEnd = (sub.current_period_end ?? item?.current_period_end ?? 0) * 1000;
  const status = membershipStatus(sub.status);
  const plan: Membership["plan"] = item?.price?.recurring?.interval === "year" ? "yearly" : "monthly";
  const now = Date.now();

  await db.patchUser(userId, (u) => {
    const prev = u.membership;
    const sameSub = prev?.stripeSubscriptionId === sub.id;
    // Un aviso tardío de una suscripción vieja no pisa la actual.
    if (!sameSub && prev?.status === "active" && status !== "active") return u;
    const membership: Membership = sameSub
      ? {
          ...prev!,
          status,
          plan,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: !!sub.cancel_at_period_end,
          // Al volver de un impago, los 30 días cuentan desde hoy, no desde antes.
          lastAccrualAt: prev!.status !== "active" && status === "active" ? now : prev!.lastAccrualAt,
        }
      : {
          status,
          plan,
          stripeCustomerId: sub.customer,
          stripeSubscriptionId: sub.id,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: !!sub.cancel_at_period_end,
          // Alta nueva: el primer vídeo incluido llega ya. Si fue socio antes,
          // conserva los que no gastó (con el tope).
          credits: Math.min(MEMBERSHIP.maxCredits, (prev?.credits ?? 0) + 1),
          lastAccrualAt: now,
          startedAt: now,
        };
    return { ...u, membership };
  });
}
