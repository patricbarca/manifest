import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { me } from "@/lib/social/me";
import { db } from "@/lib/db/store";
import { manifests } from "@/lib/manifest/store";
import { FREE_DAILY_CAP, FREE_MANIFESTATIONS, PAYMENTS_ENABLED } from "@/lib/pricing";
import { freeScenesToday } from "@/lib/manifest/free";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Embudo — ManifestLifeAI", robots: { index: false, follow: false } };


const RANGES = { "7": 7, "30": 30, all: 0 } as const;
type Range = keyof typeof RANGES;

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : "—");
const usd = (cents: number) => `${(cents / 100).toFixed(2)} $`;

/**
 * Embudo de la escena gratis, calculado con los datos que ya se guardan
 * (cuentas, manifestaciones y proyectos): no hace falta tabla de eventos.
 */
export default async function FunnelPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const who = await me();
  if (!who || !isAdmin(who.user.email)) notFound();
  const d = ((await searchParams).d ?? "7") as Range;
  const days = RANGES[d] ?? 7;
  const since = days ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;

  const users = await db.listUsers();
  const signups = users.filter((u) => u.createdAt >= since).length;
  const freeUsers = users.filter((u) => (u.freeSceneAt ?? 0) >= since && u.freeSceneAt);
  let ready = 0;
  let failedOrPending = 0;
  let costCents = 0;
  let bought = 0;
  let revenueCents = 0;
  let consent = 0;
  let day1 = 0;
  let day3 = 0;
  for (const u of freeUsers) {
    const mine = (await manifests.list(u.id)).filter((m) => m.free || (m.createdAt >= (u.freeSceneAt ?? 0) - 60_000 && m.createdAt <= (u.freeSceneAt ?? 0) + 60_000));
    if (mine.some((m) => m.status === "ready")) ready++;
    else failedOrPending++;
    costCents += mine.reduce((s, m) => s + (m.costCents ?? 0), 0);
    const paidProjects = (await db.listProjects(u.id)).filter((p) => (p.paidCents ?? 0) > 0);
    if (paidProjects.length || (u.creditSessions?.length ?? 0) > 0) bought++;
    revenueCents += paidProjects.reduce((s, p) => s + (p.paidCents ?? 0), 0);
    if (u.marketing) consent++;
    if (u.freeFollowups?.includes(1)) day1++;
    if (u.freeFollowups?.includes(3)) day3++;
  }

  const rows: [string, string, string][] = [
    ["Cuentas nuevas", String(signups), ""],
    ["Usaron su escena gratis", String(freeUsers.length), pct(freeUsers.length, signups) + " de las cuentas nuevas"],
    ["Escena gratis lista", String(ready), pct(ready, freeUsers.length)],
    ["Fallida o en cola", String(failedOrPending), ""],
    ["Aceptaron emails de novedades", String(consent), pct(consent, freeUsers.length)],
    ["Email día 1 enviado", String(day1), ""],
    ["Email día 3 enviado", String(day3), ""],
    ["Compraron después (vídeo o paquete)", String(bought), pct(bought, freeUsers.length)],
    ["Ingresos por vídeos de esos compradores", usd(revenueCents), "sin contar paquetes"],
    ["Coste de las escenas gratis", usd(costCents), freeUsers.length ? `${usd(costCents / freeUsers.length)} por escena` : ""],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <Link href="/admin" className="t-caption text-[var(--color-label-3)]">← Panel</Link>
        <h1 className="t-title mt-2">Embudo de la escena gratis</h1>
        <p className="t-caption mt-1 text-[var(--color-label-3)]">
          Escena gratis {FREE_MANIFESTATIONS && PAYMENTS_ENABLED ? "activa" : "apagada"} · hoy {await freeScenesToday()} de {FREE_DAILY_CAP} (tope diario, UTC)
        </p>
      </div>
      <nav className="t-sub flex gap-3">
        {(Object.keys(RANGES) as Range[]).map((k) => (
          <Link key={k} href={`/admin/funnel?d=${k}`} className={k === d ? "font-medium underline" : "text-[var(--color-label-3)]"}>
            {k === "all" ? "Todo" : `${k} días`}
          </Link>
        ))}
      </nav>
      <table className="t-sub w-full">
        <tbody>
          {rows.map(([label, value, note]) => (
            <tr key={label} className="border-b border-[var(--color-hairline)]">
              <td className="py-2.5 pr-4 text-[var(--color-label-2)]">{label}</td>
              <td className="py-2.5 pr-4 text-right font-medium tabular-nums">{value}</td>
              <td className="t-caption py-2.5 text-[var(--color-label-3)]">{note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="t-caption text-[var(--color-label-3)]">
        Calculado con cuentas, manifestaciones y proyectos guardados. Cuenta solo cuentas con email. Los clics en anuncios y las conversiones se ven en Google Ads y TikTok.
      </p>
    </div>
  );
}
