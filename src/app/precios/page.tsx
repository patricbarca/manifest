import Link from "next/link";
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
  { label: "Vídeo Visión · 30 s", key: "vision:30" as const, tier: "vision" as const, d: 30 as const },
  { label: "Vídeo Visión · 60 s", key: "vision:60" as const, tier: "vision" as const, d: 60 as const },
  { label: "Vídeo Cine · 30 s", key: "cinematic:30" as const, tier: "cinematic" as const, d: 30 as const },
  { label: "Vídeo Cine · 60 s", key: "cinematic:60" as const, tier: "cinematic" as const, d: 60 as const },
];

export default function PreciosPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl leading-tight">
          Pagas por lo que generas, no por estar suscrito
        </h1>
        <p className="mt-4 text-white/60">
          Todo va en créditos. 1 crédito = {CREDIT_EUR.toFixed(2)} €. Un vídeo Visión de
          60 segundos son {creditCost("vision", 60)} créditos; uno Cine, {creditCost("cinematic", 60)}.
          La diferencia es real: animar cada escena cuesta entre 30 y 100 veces más que
          generar una imagen.
        </p>
      </header>

      {/* ── Planes ───────────────────────────────────────────────────────── */}
      <div className="mt-12 grid gap-5 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`card flex flex-col rounded-xl2 p-6 ${
              plan.highlight ? "ring-1 ring-gold/50" : ""
            }`}
          >
            {plan.highlight && (
              <span className="mb-3 self-start rounded-full bg-gold/15 px-2.5 py-1 text-[11px] text-gold">
                El más elegido
              </span>
            )}
            <h2 className="font-display text-xl">{plan.name}</h2>
            <p className="mt-1 min-h-10 text-sm text-white/50">{plan.tagline}</p>

            <p className="mt-5">
              <span className="font-display text-4xl">
                {plan.priceEur === 0 ? "0" : plan.priceEur.toFixed(2)}
              </span>
              <span className="text-white/45"> € /mes</span>
            </p>
            <p className="mt-1 text-sm text-gold">
              {plan.creditsPerMonth} créditos{plan.id === "free" ? " una vez" : " al mes"}
            </p>

            <ul className="mt-6 flex-1 space-y-2 text-sm text-white/65">
              {plan.perks.map((perk) => (
                <li key={perk} className="flex gap-2.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  {perk}
                </li>
              ))}
            </ul>

            <Link
              href="/crear"
              className={`mt-7 rounded-full px-5 py-2.5 text-center text-sm font-medium transition ${
                plan.highlight
                  ? "bg-gold text-ink-950 hover:bg-gold-deep"
                  : "border border-white/15 hover:border-white/35"
              }`}
            >
              {plan.priceEur === 0 ? "Empezar gratis" : "Elegir " + plan.name}
            </Link>
          </div>
        ))}
      </div>

      {/* ── Qué cuesta cada cosa ─────────────────────────────────────────── */}
      <section className="mt-20 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl">Qué cuesta cada cosa</h2>
          <table className="mt-5 w-full text-sm">
            <thead className="text-left text-white/40">
              <tr>
                <th className="pb-3 font-normal">Acción</th>
                <th className="pb-3 text-right font-normal">Créditos</th>
                <th className="pb-3 text-right font-normal">≈ €</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {USAGE.map((row) => (
                <tr key={row.key}>
                  <td className="py-3">{row.label}</td>
                  <td className="py-3 text-right tabular-nums">{CREDIT_COST[row.key]}</td>
                  <td className="py-3 text-right tabular-nums text-white/55">
                    {(CREDIT_COST[row.key] * CREDIT_EUR).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-3">Rehacer una imagen</td>
                <td className="py-3 text-right tabular-nums">{CREDIT_COST["regen:image"]}</td>
                <td className="py-3 text-right tabular-nums text-white/55">
                  {(CREDIT_COST["regen:image"] * CREDIT_EUR).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-3">Rehacer una escena animada</td>
                <td className="py-3 text-right tabular-nums">{CREDIT_COST["regen:clip"]}</td>
                <td className="py-3 text-right tabular-nums text-white/55">
                  {(CREDIT_COST["regen:clip"] * CREDIT_EUR).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-3">Cambiar la voz</td>
                <td className="py-3 text-right tabular-nums">{CREDIT_COST["regen:voice"]}</td>
                <td className="py-3 text-right tabular-nums text-white/55">
                  {(CREDIT_COST["regen:voice"] * CREDIT_EUR).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          <p className="mt-5 text-xs leading-relaxed text-white/35">
            Coste de producción por nuestra parte, para que se vea de dónde salen los
            números: {(estimateCostCents("vision", 60) / 100).toFixed(2)} $ un Visión de
            60 s y {(estimateCostCents("cinematic", 60) / 100).toFixed(2)} $ un Cine de
            60 s, a precio de lista de proveedor.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl">Sin suscripción</h2>
          <p className="mt-2 text-sm text-white/50">
            Los créditos sueltos no caducan mientras la cuenta esté activa.
          </p>
          <div className="mt-5 space-y-3">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.credits}
                className={`card flex items-center justify-between rounded-xl2 p-5 ${
                  pack.best ? "ring-1 ring-gold/40" : ""
                }`}
              >
                <div>
                  <p className="font-medium">{pack.credits} créditos</p>
                  <p className="text-sm text-white/45">{pack.label}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl">{pack.priceEur.toFixed(2)} €</p>
                  <p className="text-xs text-white/40">
                    {((pack.priceEur / pack.credits) * 100).toFixed(1)} cts/crédito
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="card mt-8 rounded-xl2 p-6">
            <h3 className="font-display text-lg">Vender en el market</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
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
