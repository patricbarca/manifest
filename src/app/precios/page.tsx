import Link from "next/link";
import { Icon } from "@/components/Icon";
import {
  CREDIT_COST,
  CREDIT_EUR,
  CREDIT_PACKS,
  PLANS,
  creditCost,
  estimateCostCents,
} from "@/lib/pricing";

export const metadata = { title: "Precios — Manifest" };

const USAGE = [
  { label: "Vídeo Visión · 30 s", key: "vision:30" },
  { label: "Vídeo Visión · 60 s", key: "vision:60" },
  { label: "Vídeo Cine · 30 s", key: "cinematic:30" },
  { label: "Vídeo Cine · 60 s", key: "cinematic:60" },
  { label: "Rehacer una imagen", key: "regen:image" },
  { label: "Rehacer una escena animada", key: "regen:clip" },
  { label: "Cambiar la voz", key: "regen:voice" },
];

export default function PreciosPage() {
  return (
    <div className="mx-auto max-w-[1120px] px-6 py-20">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="t-display text-balance">Pagas por lo que generas</h1>
        <p className="t-body mx-auto mt-6 max-w-lg text-pretty text-[var(--color-label-2)]">
          Todo va en créditos. 1 crédito = {CREDIT_EUR.toFixed(2)} €. Un vídeo Visión de
          60 segundos son {creditCost("vision", 60)} créditos; uno Cine,{" "}
          {creditCost("cinematic", 60)}. La diferencia es real: animar cada escena cuesta
          entre 30 y 100 veces más que generar una imagen.
        </p>
      </header>

      {/* ── Planes ───────────────────────────────────────────────────────── */}
      <div className="mt-16 grid gap-4 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`card flex flex-col rounded-[var(--radius-lg)] p-6 ${
              plan.highlight ? "border-[var(--color-hairline-strong)]" : ""
            }`}
          >
            <div className="flex h-5 items-center">
              {plan.highlight && (
                <span className="t-eyebrow rounded-full bg-white px-2 py-1 text-black">
                  Más elegido
                </span>
              )}
            </div>

            <h2 className="t-headline mt-4">{plan.name}</h2>
            <p className="t-caption mt-1 min-h-9 text-[var(--color-label-2)]">
              {plan.tagline}
            </p>

            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-[2.25rem] font-semibold leading-none tracking-[-0.032em] tabular-nums">
                {plan.priceEur === 0 ? "0" : plan.priceEur.toFixed(2)}
              </span>
              <span className="t-sub text-[var(--color-label-2)]">€/mes</span>
            </p>
            <p className="t-caption mt-2 tabular-nums text-[var(--color-label-2)]">
              {plan.creditsPerMonth} créditos{plan.id === "free" ? " una vez" : " al mes"}
            </p>

            <ul className="mt-7 flex-1 space-y-2.5">
              {plan.perks.map((perk) => (
                <li key={perk} className="t-caption flex gap-2.5 text-[var(--color-label-2)]">
                  <Icon
                    name="check"
                    size={13}
                    className="mt-[3px] shrink-0 text-[var(--color-label-1)]"
                  />
                  {perk}
                </li>
              ))}
            </ul>

            <Link
              href="/crear"
              className={`interactive mt-8 rounded-full px-5 py-2.5 text-center text-[14px] font-medium tracking-[-0.01em] ${
                plan.highlight
                  ? "bg-white text-black hover:bg-white/90"
                  : "border border-[var(--color-hairline)] text-[var(--color-label-1)]"
              }`}
            >
              {plan.priceEur === 0 ? "Empezar gratis" : `Elegir ${plan.name}`}
            </Link>
          </div>
        ))}
      </div>

      {/* ── Qué cuesta cada cosa ─────────────────────────────────────────── */}
      <section className="mt-28 grid gap-16 lg:grid-cols-2">
        <div>
          <h2 className="t-title">Qué cuesta cada cosa</h2>
          <table className="mt-8 w-full">
            <thead>
              <tr className="t-caption text-[var(--color-label-3)]">
                <th className="pb-3 text-left font-normal">Acción</th>
                <th className="pb-3 text-right font-normal">Créditos</th>
                <th className="pb-3 text-right font-normal">≈ €</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)]">
              {USAGE.map((row) => (
                <tr key={row.key} className="t-sub">
                  <td className="py-3.5 text-[var(--color-label-1)]">{row.label}</td>
                  <td className="py-3.5 text-right tabular-nums">{CREDIT_COST[row.key]}</td>
                  <td className="py-3.5 text-right tabular-nums text-[var(--color-label-2)]">
                    {(CREDIT_COST[row.key] * CREDIT_EUR).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="t-caption mt-6 leading-relaxed text-[var(--color-label-3)]">
            Coste de producción por nuestra parte, para que se vea de dónde salen los
            números: {(estimateCostCents("vision", 60) / 100).toFixed(2)} $ un Visión de
            60 s y {(estimateCostCents("cinematic", 60) / 100).toFixed(2)} $ un Cine de
            60 s, a precio de lista de proveedor.
          </p>
        </div>

        <div>
          <h2 className="t-title">Sin suscripción</h2>
          <p className="t-sub mt-3 text-[var(--color-label-2)]">
            Los créditos sueltos no caducan mientras la cuenta esté activa.
          </p>
          <div className="mt-8 space-y-3">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.credits}
                className={`card flex items-center justify-between rounded-[var(--radius-md)] p-5 ${
                  pack.best ? "border-[var(--color-hairline-strong)]" : ""
                }`}
              >
                <div>
                  <p className="t-headline tabular-nums">{pack.credits} créditos</p>
                  <p className="t-caption mt-0.5 text-[var(--color-label-2)]">{pack.label}</p>
                </div>
                <div className="text-right">
                  <p className="t-headline tabular-nums">{pack.priceEur.toFixed(2)} €</p>
                  <p className="t-caption mt-0.5 tabular-nums text-[var(--color-label-3)]">
                    {((pack.priceEur / pack.credits) * 100).toFixed(1)} cts/crédito
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="card mt-10 rounded-[var(--radius-md)] p-6">
            <h3 className="t-headline">Vender en el market</h3>
            <p className="t-sub mt-2 leading-relaxed text-[var(--color-label-2)]">
              Si publicas un blueprint —tu guion, tus escenas, tu estilo— te llevas el 70 %
              de cada venta (80 % en Visionario). Quien lo compra genera su propio vídeo
              con su cara y paga su generación con sus créditos.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
