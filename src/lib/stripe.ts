import { createHmac, timingSafeEqual } from "node:crypto";
import { PAYMENTS_ENABLED } from "./pricing";

/**
 * Stripe Checkout por vídeo y suscripción de socio, con la API REST (sin SDK).
 *
 * Se activa con PAYMENTS_ENABLED=true + STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET.
 * Flujo: el proyecto se crea en "draft", el usuario paga en Stripe y el webhook
 * checkout.session.completed lo pasa a la cola y arranca la generación.
 */

const API = "https://api.stripe.com/v1";

export function stripeEnabled(): boolean {
  return PAYMENTS_ENABLED && !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET;
}

export function siteOrigin(request: Request): string {
  return process.env.SITE_URL ?? new URL(request.url).origin;
}

export async function createCheckout(opts: {
  projectId: string;
  priceCents: number;
  productName: string;
  locale: string;
  origin: string;
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": process.env.STRIPE_CURRENCY ?? "usd",
    "line_items[0][price_data][unit_amount]": String(opts.priceCents),
    "line_items[0][price_data][product_data][name]": opts.productName,
    success_url: `${opts.origin}/video/${opts.projectId}?paid=1`,
    cancel_url: `${opts.origin}/crear?cancelled=1`,
    client_reference_id: opts.projectId,
    "metadata[projectId]": opts.projectId,
    "payment_intent_data[metadata][projectId]": opts.projectId,
    locale: opts.locale === "es" ? "es" : "en",
    allow_promotion_codes: "true",
  });
  const res = await fetch(`${API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !data.id || !data.url) {
    throw new Error(`Stripe: ${data.error?.message ?? res.status}`);
  }
  return { id: data.id, url: data.url };
}

/** Llamada a la API REST de Stripe con el cuerpo en form-urlencoded. */
async function stripe<T>(path: string, body?: URLSearchParams): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
  });
  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe: ${data.error?.message ?? res.status}`);
  return data;
}

/**
 * Alta como socio: Checkout en modo suscripción con el precio en línea (no
 * hace falta crear productos en el panel de Stripe). El userId viaja en los
 * metadatos de la suscripción para que los eventos posteriores sepan de quién son.
 */
export async function createMembershipCheckout(opts: {
  userId: string;
  email: string;
  plan: "monthly" | "yearly";
  amountCents: number;
  productName: string;
  locale: string;
  origin: string;
  customerId?: string;
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": process.env.STRIPE_CURRENCY ?? "usd",
    "line_items[0][price_data][unit_amount]": String(opts.amountCents),
    "line_items[0][price_data][recurring][interval]": opts.plan === "yearly" ? "year" : "month",
    "line_items[0][price_data][product_data][name]": opts.productName,
    success_url: `${opts.origin}/biblioteca?member=1`,
    cancel_url: `${opts.origin}/precios?cancelled=1`,
    client_reference_id: opts.userId,
    "metadata[userId]": opts.userId,
    "subscription_data[metadata][userId]": opts.userId,
    locale: opts.locale === "es" ? "es" : "en",
    allow_promotion_codes: "true",
  });
  if (opts.customerId) body.set("customer", opts.customerId);
  else if (opts.email) body.set("customer_email", opts.email);
  const data = await stripe<{ id?: string; url?: string }>("/checkout/sessions", body);
  if (!data.id || !data.url) throw new Error("Stripe: sesión sin URL");
  return { id: data.id, url: data.url };
}

/** Lo que usamos de una suscripción de Stripe. */
export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end?: boolean;
  /** En versiones recientes de la API vive en cada item, no aquí. */
  current_period_end?: number;
  metadata?: { userId?: string };
  items?: {
    data?: {
      current_period_end?: number;
      price?: { recurring?: { interval?: string } };
    }[];
  };
}

export function getSubscription(id: string): Promise<StripeSubscription> {
  return stripe<StripeSubscription>(`/subscriptions/${encodeURIComponent(id)}`);
}

/** Portal de Stripe para cambiar tarjeta, plan o cancelar. Hay que activarlo en el panel. */
export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const data = await stripe<{ url?: string }>(
    "/billing_portal/sessions",
    new URLSearchParams({ customer: customerId, return_url: returnUrl }),
  );
  if (!data.url) throw new Error("Stripe: portal sin URL");
  return data.url;
}

export interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

/**
 * Comprueba la firma del webhook (cabecera Stripe-Signature: t=...,v1=...).
 * Devuelve el evento si la firma es buena y reciente; si no, null.
 */
export function verifyWebhook(payload: string, header: string | null, toleranceSec = 300): StripeEvent | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return null;
  const parts = header.split(",").map((p) => p.split("=") as [string, string]);
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !sigs.length) return null;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return null;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest();
  const ok = sigs.some((s) => {
    const got = Buffer.from(s, "hex");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
  if (!ok) return null;
  try {
    return JSON.parse(payload) as StripeEvent;
  } catch {
    return null;
  }
}
