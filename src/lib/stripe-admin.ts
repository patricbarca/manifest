import { randomBytes } from "node:crypto";
import { PAYMENTS_ENABLED } from "./pricing";

/**
 * Herramientas del panel para Stripe: revisar que la cuenta y el webhook
 * están bien configurados y crear códigos de descuento de prueba. Usa la
 * clave del servidor (STRIPE_SECRET_KEY); nada de esto llega al navegador.
 */

const API = "https://api.stripe.com/v1";

export type CheckState = "ok" | "warn" | "fail";
export interface Check {
  label: string;
  state: CheckState;
  detail?: string;
}

async function stripe<T>(path: string, init?: { method?: string; body?: URLSearchParams }): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { ok: false, status: 0, error: "Falta STRIPE_SECRET_KEY" };
  try {
    const res = await fetch(`${API}${path}`, {
      method: init?.method ?? "GET",
      headers: { Authorization: `Bearer ${key}`, ...(init?.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
      body: init?.body,
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
    if (!res.ok) return { ok: false, status: res.status, error: data.error?.message ?? `Stripe ${res.status}` };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

const noPermission = (status: number) => status === 401 || status === 403;

type Account = {
  country?: string;
  default_currency?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  business_profile?: { name?: string | null; url?: string | null; support_email?: string | null };
  settings?: { payments?: { statement_descriptor?: string | null }; card_payments?: { statement_descriptor_prefix?: string | null } };
  requirements?: { currently_due?: string[]; past_due?: string[]; eventually_due?: string[]; disabled_reason?: string | null; current_deadline?: number | null };
};
type Endpoint = { url: string; status: string; enabled_events: string[]; livemode: boolean };

/** Lista de comprobaciones, en el orden de la "Setup guide" de Stripe más lo propio de la app. */
export async function stripeSetupChecks(): Promise<Check[]> {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const checks: Check[] = [];

  // 1. La app.
  checks.push({
    label: "Clave de Stripe en la app",
    state: !key ? "fail" : /_live_/.test(key) ? "ok" : "warn",
    detail: !key ? "Falta STRIPE_SECRET_KEY en Railway." : /_live_/.test(key) ? `Modo live (${key.slice(0, 3)}…)` : "Es una clave de prueba (test): no cobra de verdad.",
  });
  checks.push({
    label: "Secreto del webhook",
    state: process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_") ? "ok" : "fail",
    detail: process.env.STRIPE_WEBHOOK_SECRET ? undefined : "Falta STRIPE_WEBHOOK_SECRET en Railway.",
  });
  checks.push({
    label: "Pagos activados en la app",
    state: PAYMENTS_ENABLED ? "ok" : "fail",
    detail: PAYMENTS_ENABLED ? undefined : "PAYMENTS_ENABLED no es «true»: la app no cobra.",
  });
  checks.push({
    label: "App abierta al público",
    state: process.env.ACCESS_CODE ? "warn" : "ok",
    detail: process.env.ACCESS_CODE ? "ACCESS_CODE sigue puesto: solo entra quien tiene el código. Quítalo al lanzar." : undefined,
  });
  if (!key) return checks;

  // 2. La cuenta (verificación, cobros, pagos al banco, datos públicos).
  const acc = await stripe<Account>("/account");
  if (!acc.ok) {
    checks.push({
      label: "Cuenta de Stripe",
      state: "warn",
      detail: noPermission(acc.status) ? "La clave no tiene permiso para leer la cuenta; revísalo en el Dashboard." : acc.error,
    });
  } else {
    const a = acc.data;
    const due = [...(a.requirements?.past_due ?? []), ...(a.requirements?.currently_due ?? [])];
    checks.push({ label: "Datos del negocio enviados", state: a.details_submitted ? "ok" : "fail" });
    checks.push({
      label: "Puede cobrar",
      state: a.charges_enabled ? "ok" : "fail",
      detail: a.charges_enabled ? undefined : `Cobros desactivados${a.requirements?.disabled_reason ? `: ${a.requirements.disabled_reason}` : ""}.`,
    });
    checks.push({
      label: "Puede pagarte al banco",
      state: a.payouts_enabled ? "ok" : "fail",
      detail: a.payouts_enabled ? undefined : "Falta la cuenta bancaria o la verificación para los pagos.",
    });
    checks.push({
      label: "Requisitos pendientes",
      state: due.length ? "fail" : (a.requirements?.eventually_due?.length ?? 0) ? "warn" : "ok",
      detail: due.length
        ? `Pendiente ahora: ${due.join(", ")}`
        : a.requirements?.eventually_due?.length
          ? `Más adelante: ${a.requirements.eventually_due.join(", ")}`
          : undefined,
    });
    const descriptor = a.settings?.payments?.statement_descriptor;
    checks.push({
      label: "Texto en el extracto bancario",
      state: descriptor ? "ok" : "warn",
      detail: descriptor ? descriptor : "Sin definir: el cliente puede no reconocer el cargo.",
    });
    const bp = a.business_profile ?? {};
    const missing = [!bp.name && "nombre público", !bp.url && "web", !bp.support_email && "email de soporte"].filter(Boolean);
    checks.push({
      label: "Perfil público (nombre, web, soporte)",
      state: missing.length ? "warn" : "ok",
      detail: missing.length ? `Falta: ${missing.join(", ")}.` : `${bp.name} · ${bp.url} · ${bp.support_email}`,
    });
    checks.push({ label: "País y moneda de la cuenta", state: "ok", detail: `${a.country ?? "?"} · ${(a.default_currency ?? "?").toUpperCase()} (la app cobra en USD)` });
  }

  // 3. El webhook que avisa a la app de los pagos.
  const hooks = await stripe<{ data: Endpoint[] }>("/webhook_endpoints?limit=20");
  if (!hooks.ok) {
    checks.push({
      label: "Webhook en Stripe",
      state: "warn",
      detail: noPermission(hooks.status) ? "La clave no puede leer los webhooks; revísalo en el Dashboard." : hooks.error,
    });
  } else {
    const ours = hooks.data.data.filter((e) => e.url.endsWith("/api/stripe/webhook"));
    const good = ours.find((e) => e.status === "enabled" && (e.enabled_events.includes("*") || e.enabled_events.includes("checkout.session.completed")));
    checks.push({
      label: "Webhook en Stripe",
      state: good ? "ok" : "fail",
      detail: good
        ? `${good.url} · ${good.enabled_events.join(", ")}`
        : ours.length
          ? "Existe pero está desactivado o no escucha checkout.session.completed."
          : "No hay ningún webhook apuntando a /api/stripe/webhook.",
    });
    if (good) {
      const expired = good.enabled_events.includes("*") || good.enabled_events.includes("checkout.session.expired");
      checks.push({
        label: "Aviso de pago sin terminar",
        state: expired ? "ok" : "warn",
        detail: expired
          ? "El webhook escucha checkout.session.expired: se manda el recordatorio."
          : "Añade el evento checkout.session.expired al webhook para mandar el recordatorio de pago sin terminar.",
      });
    }
  }
  return checks;
}

export interface TestCode {
  code: string;
  what: string;
}

/**
 * Crea 2 códigos de un solo uso para probar compras: uno del 100 % (gratis)
 * y otro de 9 USD (el pack de 1 deseo queda en 1 USD). El final aleatorio
 * evita que se adivinen.
 */
export async function createTestCodes(): Promise<{ ok: true; codes: TestCode[] } | { ok: false; error: string }> {
  const tail = randomBytes(3).toString("hex").toUpperCase();
  const specs: { name: string; coupon: Record<string, string>; code: string; what: string; minimum?: string }[] = [
    { name: "Prueba gratis (100 %)", coupon: { percent_off: "100" }, code: `PRUEBA100-${tail}`, what: "100 % de descuento: el pedido sale gratis." },
    {
      name: "Prueba US$1 (−9 USD)",
      coupon: { amount_off: "900", currency: "usd" },
      code: `PRUEBA1-${tail}`,
      what: "9 USD de descuento en pedidos desde 10 USD: el pack de 1 deseo cuesta 1 USD.",
      minimum: "1000",
    },
  ];
  const codes: TestCode[] = [];
  for (const s of specs) {
    const coupon = await stripe<{ id: string }>("/coupons", {
      method: "POST",
      body: new URLSearchParams({ name: s.name, duration: "once", max_redemptions: "1", ...s.coupon }),
    });
    if (!coupon.ok) return { ok: false, error: noPermission(coupon.status) ? "La clave de Stripe no tiene permiso para crear cupones." : coupon.error };
    // Las versiones nuevas de la API piden promotion[coupon]; las anteriores, coupon.
    const make = (newApi: boolean) => {
      const body = new URLSearchParams({ code: s.code, max_redemptions: "1" });
      if (newApi) {
        body.set("promotion[type]", "coupon");
        body.set("promotion[coupon]", coupon.data.id);
      } else body.set("coupon", coupon.data.id);
      if (s.minimum) {
        body.set("restrictions[minimum_amount]", s.minimum);
        body.set("restrictions[minimum_amount_currency]", "usd");
      }
      return stripe<{ code: string }>("/promotion_codes", { method: "POST", body });
    };
    let promo = await make(true);
    if (!promo.ok && /promotion|unknown parameter/i.test(promo.error)) promo = await make(false);
    if (!promo.ok) return { ok: false, error: noPermission(promo.status) ? "La clave de Stripe no tiene permiso para crear códigos promocionales." : promo.error };
    codes.push({ code: promo.data.code, what: s.what });
  }
  return { ok: true, codes };
}
