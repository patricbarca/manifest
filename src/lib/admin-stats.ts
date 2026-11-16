import { db } from "./db/store";
import { manifests } from "./manifest/store";
import { social } from "./social/store";
import { localDay } from "./social/aura";

const DAY = 24 * 3600_000;

// ── Uso de la app (nuestra base de datos) ───────────────────────────────────

export interface AppStats {
  users: { total: number; new7: number; new30: number; active7: number };
  videos: { total: number; last30: number; ready: number; failed: number; inProgress: number };
  manifestations: { total: number; last30: number };
  /** Coste estimado de IA (fal, voz, guion) de lo creado en 30 días, en dólares. */
  aiCost30: number;
  /** Personas que crearon algo (vídeo o manifestación) en 30 días. */
  creators30: number;
}

export async function appStats(): Promise<AppStats> {
  const now = Date.now();
  const [users, projects] = await Promise.all([db.listUsers(), db.listAllProjects()]);
  const lists = await Promise.all(users.map((u) => manifests.list(u.id).catch(() => [])));
  const allManifests = lists.flat();

  const since7 = now - 7 * DAY;
  const since30 = now - 30 * DAY;
  const today = localDay("UTC");
  const weekAgo = localDay("UTC", new Date(since7));

  // Activos: vieron un vídeo (aura) o crearon algo en los últimos 7 días.
  const active = new Set<string>();
  for (const p of projects) if (p.createdAt >= since7) active.add(p.ownerId);
  for (const m of allManifests) if (m.createdAt >= since7) active.add(m.ownerId);
  const views = await Promise.all(users.map((u) => social.listViews(u.id).catch(() => [])));
  users.forEach((u, i) => {
    if (views[i].some((v) => v.day >= weekAgo && v.day <= today)) active.add(u.id);
  });

  const creators = new Set<string>();
  let cost = 0;
  for (const p of projects) {
    if (p.createdAt < since30) continue;
    creators.add(p.ownerId);
    cost += p.costCents ?? 0;
  }
  for (const m of allManifests) {
    if (m.createdAt < since30) continue;
    creators.add(m.ownerId);
    cost += m.costCents ?? 0;
  }

  return {
    users: {
      total: users.length,
      new7: users.filter((u) => u.createdAt >= since7).length,
      new30: users.filter((u) => u.createdAt >= since30).length,
      active7: active.size,
    },
    videos: {
      total: projects.length,
      last30: projects.filter((p) => p.createdAt >= since30).length,
      ready: projects.filter((p) => p.status === "ready").length,
      failed: projects.filter((p) => p.status === "failed").length,
      inProgress: projects.filter((p) => p.status === "queued" || p.status === "generating" || p.status === "review").length,
    },
    manifestations: { total: allManifests.length, last30: allManifests.filter((m) => m.createdAt >= since30).length },
    aiCost30: +(cost / 100).toFixed(2),
    creators30: creators.size,
  };
}

// ── Ingresos (Stripe) ───────────────────────────────────────────────────────

export interface StripeStats {
  ok: boolean;
  /** Cobrado menos reembolsado, en la moneda del cobro (USD). */
  net30: number;
  net7: number;
  payments30: number;
  payers30: number;
  refunded30: number;
  error?: string;
}

type Charge = { amount: number; amount_refunded: number; paid: boolean; status: string; created: number; billing_details?: { email?: string | null }; customer?: string | null };

export async function stripeStats(): Promise<StripeStats> {
  const key = process.env.STRIPE_SECRET_KEY;
  const empty = { net30: 0, net7: 0, payments30: 0, payers30: 0, refunded30: 0 };
  if (!key) return { ok: false, ...empty, error: "Stripe no está configurado." };
  const since = Math.floor((Date.now() - 30 * DAY) / 1000);
  const since7 = Math.floor((Date.now() - 7 * DAY) / 1000);
  const charges: Charge[] = [];
  let after: string | undefined;
  try {
    // Como mucho 500 cobros (5 páginas): de sobra para el panel.
    for (let page = 0; page < 5; page++) {
      const url = new URL("https://api.stripe.com/v1/charges");
      url.searchParams.set("limit", "100");
      url.searchParams.set("created[gte]", String(since));
      if (after) url.searchParams.set("starting_after", after);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
      if (!res.ok) return { ok: false, ...empty, error: `Stripe ${res.status}` };
      const body = (await res.json()) as { data: (Charge & { id: string })[]; has_more: boolean };
      charges.push(...body.data);
      if (!body.has_more || !body.data.length) break;
      after = body.data[body.data.length - 1].id;
    }
  } catch (err) {
    return { ok: false, ...empty, error: err instanceof Error ? err.message : String(err) };
  }
  const paid = charges.filter((c) => c.paid && c.status === "succeeded");
  const net = (list: Charge[]) => list.reduce((s, c) => s + c.amount - c.amount_refunded, 0) / 100;
  return {
    ok: true,
    net30: +net(paid).toFixed(2),
    net7: +net(paid.filter((c) => c.created >= since7)).toFixed(2),
    payments30: paid.length,
    payers30: new Set(paid.map((c) => c.customer || c.billing_details?.email || "")).size,
    refunded30: +(paid.reduce((s, c) => s + c.amount_refunded, 0) / 100).toFixed(2),
  };
}

// ── Embudo de pago (Stripe Checkout) ────────────────────────────────────────

export interface CheckoutStats {
  ok: boolean;
  /** Personas que abrieron el pago de Stripe en 30 días. */
  began: number;
  /** Personas que lo terminaron (pagado, también con un código del 100 %). */
  paid: number;
  /** Pagos que caducaron sin terminar. */
  expired: number;
  /** Pagos abiertos ahora mismo. */
  open: number;
  error?: string;
}

type Session = { id: string; status: string; payment_status: string; metadata?: { userId?: string; projectId?: string }; customer_details?: { email?: string | null } | null };

export async function checkoutStats(): Promise<CheckoutStats> {
  const key = process.env.STRIPE_SECRET_KEY;
  const empty = { began: 0, paid: 0, expired: 0, open: 0 };
  if (!key) return { ok: false, ...empty, error: "Stripe no está configurado." };
  const since = Math.floor((Date.now() - 30 * DAY) / 1000);
  const sessions: Session[] = [];
  let after: string | undefined;
  try {
    for (let page = 0; page < 5; page++) {
      const url = new URL("https://api.stripe.com/v1/checkout/sessions");
      url.searchParams.set("limit", "100");
      url.searchParams.set("created[gte]", String(since));
      if (after) url.searchParams.set("starting_after", after);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
      if (!res.ok) return { ok: false, ...empty, error: res.status === 403 ? "La clave de Stripe no puede leer las sesiones de pago (permiso Checkout Sessions: Read)." : `Stripe ${res.status}` };
      const body = (await res.json()) as { data: Session[]; has_more: boolean };
      sessions.push(...body.data);
      if (!body.has_more || !body.data.length) break;
      after = body.data[body.data.length - 1].id;
    }
  } catch (err) {
    return { ok: false, ...empty, error: err instanceof Error ? err.message : String(err) };
  }
  // Una persona: su id (packs), el dueño del vídeo, o su email si el borrador ya se borró.
  const projects = await db.listAllProjects().catch(() => []);
  const owner = new Map(projects.map((p) => [p.id, p.ownerId]));
  const who = (s: Session) =>
    s.metadata?.userId || (s.metadata?.projectId && owner.get(s.metadata.projectId)) || s.customer_details?.email || s.id;
  const done = sessions.filter((s) => s.status === "complete" && s.payment_status !== "unpaid");
  return {
    ok: true,
    began: new Set(sessions.map(who)).size,
    paid: new Set(done.map(who)).size,
    expired: sessions.filter((s) => s.status === "expired").length,
    open: sessions.filter((s) => s.status === "open").length,
  };
}

// ── Visitas (Cloudflare Web Analytics) ──────────────────────────────────────

export interface Row {
  label: string;
  visits: number;
  views: number;
}
export interface WebStats {
  ok: boolean;
  error?: string;
  visits24: number;
  visits7: number;
  visits30: number;
  views30: number;
  byDay: { date: string; visits: number; views: number }[];
  hosts: Row[];
  pages: Row[];
  referrers: Row[];
  countries: Row[];
  devices: Row[];
}

const CF = "https://api.cloudflare.com/client/v4";

async function cf<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${CF}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.CF_API_TOKEN}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as T & { errors?: { message: string }[] };
  if (!res.ok) throw new Error(`Cloudflare ${res.status}: ${body.errors?.map((e) => e.message).join("; ") ?? ""}`);
  return body;
}

/** El "site tag" del sitio cuyo token es el del medidor (CF_ANALYTICS_TOKEN). Se puede fijar con CF_SITE_TAG. */
async function siteTag(account: string): Promise<string> {
  if (process.env.CF_SITE_TAG) return process.env.CF_SITE_TAG;
  const list = await cf<{ result?: { site_tag: string; site_token: string }[] }>(`/accounts/${account}/rum/site_info/list?per_page=100`);
  const site = list.result?.find((s) => s.site_token === process.env.CF_ANALYTICS_TOKEN) ?? list.result?.[0];
  if (!site) throw new Error("No hay ningún sitio en Cloudflare Web Analytics.");
  return site.site_tag;
}

type Group = { count: number; sum: { visits: number }; dimensions: { metric: string } };

function groupQuery(alias: string, dim: string, limit: number, order: string): string {
  return `${alias}: rumPageloadEventsAdaptiveGroups(limit: ${limit}, filter: $filter, orderBy: [${order}]) { count sum { visits } dimensions { metric: ${dim} } }`;
}

export async function webStats(): Promise<WebStats> {
  const empty: WebStats = { ok: false, visits24: 0, visits7: 0, visits30: 0, views30: 0, byDay: [], hosts: [], pages: [], referrers: [], countries: [], devices: [] };
  const account = process.env.CF_ACCOUNT_ID;
  if (!process.env.CF_API_TOKEN || !account) return { ...empty, error: "not_configured" };
  try {
    // Listar los sitios pide otro permiso; si el token solo tiene «Account Analytics: Read»,
    // se consulta la cuenta entera (solo hay un sitio) en vez de filtrar por sitio.
    const tag = await siteTag(account).catch((err) => {
      console.warn("[admin] Cloudflare: sin lista de sitios, se usa toda la cuenta:", err instanceof Error ? err.message : err);
      return null;
    });
    const now = new Date();
    const iso = (ms: number) => new Date(ms).toISOString();
    const run = async (withBots: boolean) => {
      const base = (since: number) => ({ AND: [{ datetime_geq: iso(since), datetime_leq: now.toISOString() }, ...(tag ? [{ siteTag: tag }] : []), ...(withBots ? [] : [{ bot: 0 }])] });
      const query = `query($account: string!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject, $f24: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject, $f7: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject) {
        viewer { accounts(filter: { accountTag: $account }) {
          t24: rumPageloadEventsAdaptiveGroups(limit: 1, filter: $f24) { count sum { visits } }
          t7: rumPageloadEventsAdaptiveGroups(limit: 1, filter: $f7) { count sum { visits } }
          t30: rumPageloadEventsAdaptiveGroups(limit: 1, filter: $filter) { count sum { visits } }
          ${groupQuery("days", "date", 31, "date_ASC")}
          ${groupQuery("hosts", "requestHost", 5, "sum_visits_DESC")}
          ${groupQuery("pages", "requestPath", 10, "sum_visits_DESC")}
          ${groupQuery("refs", "refererHost", 10, "sum_visits_DESC")}
          ${groupQuery("countries", "countryName", 10, "sum_visits_DESC")}
          ${groupQuery("devices", "deviceType", 5, "sum_visits_DESC")}
        } }
      }`;
      return cf<{ data?: { viewer: { accounts: Record<string, Group[] | { count: number; sum: { visits: number } }[]>[] } }; errors?: { message: string }[] | null }>(
        "/graphql",
        {
          method: "POST",
          body: JSON.stringify({ query, variables: { account, filter: base(now.getTime() - 30 * DAY), f7: base(now.getTime() - 7 * DAY), f24: base(now.getTime() - DAY) } }),
        },
      );
    };
    // Sin bots; si Cloudflare no admite ese filtro en esta cuenta, se repite sin él.
    let out = await run(false);
    if (out.errors?.length) out = await run(true);
    if (out.errors?.length || !out.data) throw new Error(out.errors?.map((e) => e.message).join("; ") ?? "sin datos");
    const a = out.data.viewer.accounts[0] ?? {};
    const total = (k: string) => ((a[k] as { sum: { visits: number } }[] | undefined)?.[0]?.sum.visits ?? 0);
    const rows = (k: string): Row[] => ((a[k] as Group[] | undefined) ?? []).map((g) => ({ label: g.dimensions.metric || "(directo)", visits: g.sum.visits, views: g.count }));
    return {
      ok: true,
      visits24: total("t24"),
      visits7: total("t7"),
      visits30: total("t30"),
      views30: ((a.t30 as { count: number }[] | undefined)?.[0]?.count ?? 0),
      byDay: rows("days").map((r) => ({ date: r.label, visits: r.visits, views: r.views })),
      hosts: rows("hosts"),
      pages: rows("pages"),
      referrers: rows("refs"),
      countries: rows("countries"),
      devices: rows("devices"),
    };
  } catch (err) {
    console.error("[admin] Cloudflare:", err instanceof Error ? err.message : err);
    return { ...empty, error: err instanceof Error ? err.message : String(err) };
  }
}
