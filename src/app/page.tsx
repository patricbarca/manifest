import Link from "next/link";
import { BLUEPRINTS } from "@/lib/blueprints";
import { creditCost, CREDIT_EUR, estimateCostCents } from "@/lib/pricing";
import { LIFE_AREAS } from "@/lib/types";
import { isDemoMode } from "@/lib/ai";

const STEPS = [
  {
    n: "01",
    title: "Sube una foto tuya",
    body: "Un selfie de frente, con buena luz. Se usa solo para generar tus escenas y puedes borrarla cuando quieras.",
  },
  {
    n: "02",
    title: "Cuenta qué estás construyendo",
    body: "En tus palabras. «Quiero dirigir mi propio estudio en Lisboa» funciona mejor que «éxito».",
  },
  {
    n: "03",
    title: "Recibe tu vídeo con guion y voz",
    body: "Escenas contigo dentro, afirmaciones escritas para tu caso y una voz que las dice para que las repitas.",
  },
];

export default function HomePage() {
  const demo = isDemoMode();

  return (
    <div>
      {demo && (
        <div className="border-b border-gold/20 bg-gold/10 px-5 py-2.5 text-center text-xs text-gold">
          Modo demo: sin claves de API, las escenas y la voz se generan en local y no
          cuestan nada. Añade tus claves en <code className="font-mono">.env.local</code> para
          producción.
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pt-20 pb-16 sm:pt-28">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Visualización guiada, hecha para ti
            </p>
            <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl">
              Verte viviéndolo
              <br />
              <span className="text-gold">antes de que pase.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
              Sube una foto y recibe un vídeo de 30 o 60 segundos donde apareces tú
              logrando lo que estás persiguiendo. Con un guion escrito para tu caso y una
              voz que lo dice en alto, para que lo repitas con ella.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/crear"
                className="rounded-full bg-gold px-7 py-3.5 font-medium text-ink-950 transition hover:bg-gold-deep"
              >
                Crear mi vídeo gratis
              </Link>
              <Link
                href="/market"
                className="rounded-full border border-white/15 px-7 py-3.5 text-white/80 transition hover:border-white/35 hover:text-white"
              >
                Ver el market
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/40">
              30 créditos de regalo. Un vídeo de 30 s sin poner tarjeta.
            </p>
          </div>

          {/* Maqueta del reproductor, estática: la de verdad está en /video */}
          <div className="relative mx-auto w-full max-w-xs">
            <div className="absolute -inset-8 -z-10 rounded-full bg-violet-glow/20 blur-3xl" />
            <div className="aspect-[9/16] overflow-hidden rounded-xl2 ring-1 ring-white/10">
              <div className="relative h-full w-full bg-gradient-to-br from-ink-700 via-[#4c1d95] to-gold-deep">
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="font-display text-2xl leading-tight">
                    Dirijo mi propio estudio.
                  </p>
                  <p className="breathe mt-3 text-sm font-medium text-gold">
                    ahora tú — dilo en voz alta
                  </p>
                  <div className="mt-5 h-0.5 w-full rounded bg-white/20">
                    <div className="h-full w-2/5 rounded bg-gold" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="card rounded-xl2 p-7">
              <span className="font-display text-sm text-gold">{step.n}</span>
              <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Los dos productos ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl">Dos formas de verlo</h2>
        <p className="mt-2 max-w-2xl text-white/55">
          La diferencia no es la calidad de la imagen: es si las escenas se mueven de
          verdad. Las dos funcionan para visualizar, y cuestan muy distinto de producir.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <TierCard
            name="Visión"
            tagline="Imágenes tuyas con movimiento de cámara"
            credits={creditCost("vision", 60)}
            durationLabel="30 s o 60 s"
            costCents={estimateCostCents("vision", 60)}
            points={[
              "6 a 12 escenas generadas con tu cara",
              "Movimiento de cámara suave sobre cada imagen",
              "Guion y voz incluidos",
              "Listo en un par de minutos",
            ]}
          />
          <TierCard
            name="Cine"
            tagline="Escenas animadas de verdad, con movimiento propio"
            credits={creditCost("cinematic", 60)}
            durationLabel="30 s o 60 s"
            costCents={estimateCostCents("cinematic", 60)}
            highlight
            points={[
              "Cada escena es un clip generado, no una foto",
              "Tú te mueves dentro de la escena",
              "Mismo guion y voz, con más aire entre frases",
              "Tarda más y cuesta bastante más de producir",
            ]}
          />
        </div>
      </section>

      {/* ── Áreas ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl">¿Qué quieres ver?</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LIFE_AREAS.map((area) => (
            <Link
              key={area.id}
              href={`/crear?area=${area.id}`}
              className="card card-hover rounded-xl2 p-5"
            >
              <span className="text-gold">{area.emoji}</span>
              <h3 className="mt-2 font-medium">{area.label}</h3>
              <p className="mt-1 text-sm text-white/50">{area.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Market ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl">Del market</h2>
            <p className="mt-2 max-w-xl text-white/55">
              Guiones y escenas creados por otros. Tú les pones tu cara y generas tu
              propia versión.
            </p>
          </div>
          <Link href="/market" className="shrink-0 text-sm text-gold hover:underline">
            Ver todo →
          </Link>
        </div>

        <div className="no-scrollbar mt-8 flex gap-4 overflow-x-auto pb-2">
          {BLUEPRINTS.slice(0, 4).map((bp) => (
            <Link
              key={bp.slug}
              href={`/market/${bp.slug}`}
              className="card card-hover w-64 shrink-0 overflow-hidden rounded-xl2"
            >
              <div
                className="h-36"
                style={{ background: `linear-gradient(140deg, ${bp.cover.from}, ${bp.cover.to})` }}
              />
              <div className="p-4">
                <h3 className="font-medium">{bp.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-white/45">{bp.summary}</p>
                <p className="mt-3 text-sm text-gold">
                  {(bp.priceCents / 100).toFixed(2)} €
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Cierre ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h2 className="font-display text-4xl leading-tight">
          Lo que miras todos los días
          <br />
          acaba pareciéndote posible.
        </h2>
        <Link
          href="/crear"
          className="mt-8 inline-block rounded-full bg-gold px-8 py-3.5 font-medium text-ink-950 transition hover:bg-gold-deep"
        >
          Empezar
        </Link>
      </section>
    </div>
  );
}

function TierCard({
  name,
  tagline,
  credits,
  durationLabel,
  costCents,
  points,
  highlight,
}: {
  name: string;
  tagline: string;
  credits: number;
  durationLabel: string;
  costCents: number;
  points: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`card rounded-xl2 p-8 ${highlight ? "ring-1 ring-gold/40" : ""}`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display text-2xl">{name}</h3>
        <span className="text-sm text-white/45">{durationLabel}</span>
      </div>
      <p className="mt-1 text-sm text-white/55">{tagline}</p>

      <p className="mt-6">
        <span className="font-display text-4xl text-gold">{credits}</span>
        <span className="ml-2 text-sm text-white/50">
          créditos · ~{(credits * CREDIT_EUR).toFixed(2)} € el de 60 s
        </span>
      </p>

      <ul className="mt-6 space-y-2.5 text-sm text-white/65">
        {points.map((p) => (
          <li key={p} className="flex gap-2.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
            {p}
          </li>
        ))}
      </ul>

      <p className="mt-6 border-t border-white/8 pt-4 text-xs text-white/35">
        Coste de producción estimado: {(costCents / 100).toFixed(2)} $ por vídeo de 60 s.
      </p>
    </div>
  );
}
