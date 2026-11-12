import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { me } from "@/lib/social/me";
import { isAdmin } from "@/lib/admin";
import { appStats, checkoutStats, stripeStats, webStats } from "@/lib/admin-stats";
import { DayChart, Section, Tile, TopList, n } from "@/components/AdminCharts";
import { formatUsd } from "@/lib/pricing";
import { stripeSetupChecks } from "@/lib/stripe-admin";
import { StripeTestCodes } from "@/components/StripeTestCodes";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

/** Panel privado: visitas (Cloudflare), uso de la app, ingresos (Stripe) y coste de IA. */
export default async function AdminPage() {
  const who = await me();
  if (!who) redirect("/login?next=/admin");
  // A quien no es administrador, la página ni existe.
  if (!isAdmin(who.user.email)) notFound();

  const [web, app, money, setup, pay] = await Promise.all([webStats(), appStats(), stripeStats(), stripeSetupChecks(), checkoutStats()]);
  const conversion = web.visits30 ? ((money.payers30 / web.visits30) * 100).toFixed(1) : "–";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/settings" className="t-sub text-[var(--color-label-2)] hover:text-[var(--color-label-1)]">← Ajustes</Link>
        <h1 className="t-headline">Panel</h1>
        <Link href="/admin/funnel" className="t-sub text-[var(--color-label-2)] hover:text-[var(--color-label-1)]">Escena gratis →</Link>
      </div>

      <Section title="Visitas" note="Cloudflare Web Analytics, sin bots. Web pública y app juntas (ver «Dónde»).">
        {web.ok ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tile label="Últimas 24 h" value={n(web.visits24)} />
              <Tile label="7 días" value={n(web.visits7)} />
              <Tile label="30 días" value={n(web.visits30)} />
              <Tile label="Páginas vistas (30 d)" value={n(web.views30)} />
            </div>
            <DayChart days={web.byDay} />
            <div className="grid gap-5 sm:grid-cols-2">
              <TopList title="De dónde llegan" rows={web.referrers} />
              <TopList title="Páginas más vistas" rows={web.pages} />
              <TopList title="Países" rows={web.countries} />
              <TopList title="Dónde (web o app)" rows={web.hosts} />
              <TopList title="Dispositivo" rows={web.devices} />
            </div>
          </>
        ) : web.error === "not_configured" ? (
          <p className="t-caption text-[var(--color-label-2)]">
            Falta conectar Cloudflare: en Railway, <code>CF_ACCOUNT_ID</code> y <code>CF_API_TOKEN</code> (token con permiso «Account Analytics: Read»).
          </p>
        ) : (
          <p className="t-caption text-rose-300">No se pudo leer Cloudflare: {web.error}</p>
        )}
      </Section>

      <Section title="Personas" note="Desde la base de datos de la app.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Cuentas" value={n(app.users.total)} />
          <Tile label="Nuevas (7 d)" value={n(app.users.new7)} />
          <Tile label="Nuevas (30 d)" value={n(app.users.new30)} />
          <Tile label="Activas (7 d)" value={n(app.users.active7)} hint="Vieron su vídeo o crearon algo" />
        </div>
      </Section>

      <Section title="Embudo (30 días)" note="De la visita al pago. «Crearon algo» cuenta borradores y escenas; «Fueron a pagar» y «Pagaron» salen de Stripe (personas, no pedidos).">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Tile label="Visitas" value={web.ok ? n(web.visits30) : "–"} hint={web.ok ? undefined : "Falta conectar Cloudflare"} />
          <Tile label="Cuentas nuevas" value={n(app.users.new30)} />
          <Tile label="Crearon algo" value={n(app.creators30)} />
          <Tile label="Fueron a pagar" value={pay.ok ? n(pay.began) : "–"} />
          <Tile label="Pagaron" value={pay.ok ? n(pay.paid) : "–"} hint={pay.ok ? `${n(pay.expired)} sin terminar · ${n(pay.open)} abiertos` : undefined} />
        </div>
        {!pay.ok && <p className="t-caption mt-3 text-rose-300">No se pudo leer Stripe: {pay.error}</p>}
      </Section>

      <Section title="Creación">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Vídeos" value={n(app.videos.total)} hint={`${n(app.videos.last30)} en 30 días`} />
          <Tile label="Listos / fallidos" value={`${n(app.videos.ready)} / ${n(app.videos.failed)}`} hint={`${n(app.videos.inProgress)} en curso`} />
          <Tile label="Manifestaciones" value={n(app.manifestations.total)} hint={`${n(app.manifestations.last30)} en 30 días`} />
          <Tile label="Coste IA (30 d)" value={formatUsd(app.aiCost30)} hint="Estimado (fal, voz, guion)" />
        </div>
      </Section>

      <Section title="Ingresos" note="Stripe, últimos 30 días. Netos de reembolsos, sin restar comisiones.">
        {money.ok ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile label="30 días" value={formatUsd(money.net30)} hint={`${n(money.payments30)} pagos`} />
            <Tile label="7 días" value={formatUsd(money.net7)} />
            <Tile label="Reembolsado (30 d)" value={formatUsd(money.refunded30)} />
            <Tile label="Visita → compra" value={`${conversion} %`} hint={`${n(money.payers30)} compradores`} />
          </div>
        ) : (
          <p className="t-caption text-rose-300">No se pudo leer Stripe: {money.error}</p>
        )}
      </Section>

      <Section title="Stripe: configuración" note="Revisión en vivo con la clave del servidor: cuenta, cobros, pagos al banco y webhook.">
        <ul className="space-y-2">
          {setup.map((c) => (
            <li key={c.label} className="flex gap-3">
              <span aria-hidden className="w-5 shrink-0 text-center">{c.state === "ok" ? "✅" : c.state === "warn" ? "⚠️" : "❌"}</span>
              <div className="min-w-0">
                <p className="t-sub">{c.label}</p>
                {c.detail && <p className="t-caption break-words text-[var(--color-label-2)]">{c.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Stripe: códigos de prueba" note="Crea 2 códigos de un solo uso: uno gratis (100 %) y otro que deja el pack de 1 deseo en US$1. Se escriben en la página de pago, en «Añadir código promocional».">
        <StripeTestCodes />
      </Section>
    </div>
  );
}
