import Link from "next/link";
import { Icon } from "@/components/Icon";
import { TEMPLATES } from "@/lib/templates";
import { PRODUCTS, estimateCostCents, formatUsd } from "@/lib/pricing";
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
        <div className="border-b border-[var(--color-hairline)] px-6 py-2.5 text-center">
          <p className="t-caption text-[var(--color-label-3)]">
            Modo demo · sin claves de API las escenas y la voz se generan en local, sin coste
          </p>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1120px] px-6 pt-20 pb-16 sm:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="t-eyebrow rise text-[var(--color-label-3)]">
            Visualización guiada
          </p>
          <h1 className="t-display rise mt-5 text-balance">
            Verte viviéndolo
            <br />
            <span className="text-[var(--color-label-2)]">antes de que pase.</span>
          </h1>
          <p className="t-body rise mx-auto mt-5 max-w-md text-pretty text-[var(--color-label-2)]">
            Sube una foto y recibe un vídeo de 30 o 60 segundos donde apareces tú
            logrando lo que estás persiguiendo. Con un guion escrito para tu caso y una
            voz que lo dice en alto, para que lo repitas con ella.
          </p>

          <div className="rise mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/crear"
              className="interactive rounded-full bg-white px-6 py-3 text-[15px] font-medium tracking-[-0.011em] text-black hover:bg-white/90"
            >
              Crear mi vídeo
            </Link>
            <Link
              href="/market"
              className="interactive t-sub inline-flex items-center gap-1.5 rounded-full border border-[var(--color-hairline)] px-6 py-3 text-[var(--color-label-1)]"
            >
              Ver el market
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>
          <p className="t-caption mt-4 text-[var(--color-label-3)]">
            30 créditos de regalo. Sin tarjeta.
          </p>
        </div>

        {/* El reproductor, centrado y grande: es el producto. */}
        <div className="relative mx-auto mt-14 w-full max-w-[272px]">
          <div className="absolute -inset-16 -z-10 rounded-full bg-white/[0.045] blur-3xl" />
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-hairline)] bg-black shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]">
            <div className="relative aspect-[9/16] w-full">
              <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_15%,#2b3350_0%,#161a28_45%,#08090d_100%)]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-[1.6rem] font-semibold leading-[1.15] tracking-[-0.03em]">
                  Dirijo mi propio estudio.
                </p>
                <p className="t-sub pulse-soft mt-3 flex items-center gap-2 text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ahora tú — dilo en voz alta
                </p>
                <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-2/5 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1120px] px-6 py-20">
        <div className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-[var(--color-hairline)] sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="bg-[var(--color-surface-2)] p-8">
              <span className="t-eyebrow text-[var(--color-label-3)]">{step.n}</span>
              <h3 className="t-headline mt-4">{step.title}</h3>
              <p className="t-sub mt-2 text-[var(--color-label-2)]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Los dos productos ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1120px] px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="t-title">Dos formas de verlo</h2>
          <p className="t-body mt-3 text-[var(--color-label-2)]">
            La diferencia no es la calidad de la imagen: es si las escenas se mueven de
            verdad. Las dos funcionan para visualizar, y cuestan muy distinto de producir.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
          {(["vision", "cinematic"] as const).map((id) => (
            <TierCard key={id} id={id} />
          ))}
        </div>

        <p className="t-sub mt-8 text-center text-[var(--color-label-2)]">
          Tu primer vídeo es gratis. Después pagas solo cuando creas — sin
          suscripción.
        </p>
      </section>

      {/* ── Áreas ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1120px] px-6 py-20">
        <h2 className="t-title text-center">¿Qué quieres ver?</h2>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LIFE_AREAS.map((area) => (
            <Link
              key={area.id}
              href={`/crear?area=${area.id}`}
              className="card interactive group rounded-[var(--radius-md)] p-6"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-[var(--color-label-1)]">
                <Icon name={area.icon} size={18} />
              </span>
              <h3 className="t-headline mt-4">{area.label}</h3>
              <p className="t-sub mt-1 text-[var(--color-label-2)]">{area.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Market ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1120px] px-6 py-20">
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-lg">
            <h2 className="t-title">Del market</h2>
            <p className="t-body mt-3 text-[var(--color-label-2)]">
              Vídeos que ha creado otra gente. Les pones tu cara y se genera tu
              versión, contigo dentro.
            </p>
          </div>
          <Link
            href="/market"
            className="t-sub inline-flex shrink-0 items-center gap-1.5 text-[var(--color-label-1)] transition-opacity hover:opacity-60"
          >
            Ver todo
            <Icon name="arrow-right" size={15} />
          </Link>
        </div>

        <div className="no-scrollbar mt-10 flex gap-4 overflow-x-auto pb-2">
          {TEMPLATES.slice(0, 4).map((bp) => (
            <Link
              key={bp.slug}
              href={`/market/${bp.slug}`}
              className="card interactive w-[264px] shrink-0 overflow-hidden rounded-[var(--radius-md)]"
            >
              <div
                className="h-40"
                style={{ background: `linear-gradient(150deg, ${bp.cover.from}, ${bp.cover.to})` }}
              />
              <div className="p-5">
                <h3 className="t-headline">{bp.title}</h3>
                <p className="t-caption mt-1.5 line-clamp-2 text-[var(--color-label-2)]">
                  {bp.summary}
                </p>
                <p className="t-sub mt-4 tabular-nums">
                  {formatUsd(PRODUCTS[bp.tier].priceUsd)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Cierre ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-2xl px-6 py-28 text-center">
        <h2 className="t-title text-balance">
          Lo que miras todos los días acaba pareciéndote posible.
        </h2>
        <Link
          href="/crear"
          className="interactive mt-9 inline-block rounded-full bg-white px-7 py-3 text-[15px] font-medium tracking-[-0.011em] text-black hover:bg-white/90"
        >
          Empezar
        </Link>
      </section>
    </div>
  );
}

function TierCard({ id }: { id: "vision" | "cinematic" }) {
  const product = PRODUCTS[id];
  return (
    <div
      className={`card rounded-[var(--radius-lg)] p-8 ${
        id === "cinematic" ? "border-[var(--color-hairline-strong)]" : ""
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="t-headline">{product.name}</h3>
        <span className="t-caption text-[var(--color-label-3)]">30 s o 60 s</span>
      </div>
      <p className="t-sub mt-1 text-[var(--color-label-2)]">{product.tagline}</p>

      <p className="mt-7 text-[2.5rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
        {formatUsd(product.priceUsd)}
      </p>
      <p className="t-caption mt-2 text-[var(--color-label-2)]">
        por vídeo · {product.waitLabel}
      </p>

      <ul className="mt-7 space-y-3">
        {product.points.map((point) => (
          <li key={point} className="t-sub flex gap-3 text-[var(--color-label-2)]">
            <Icon
              name="check"
              size={15}
              className="mt-[3px] shrink-0 text-[var(--color-label-1)]"
            />
            {point}
          </li>
        ))}
      </ul>

      <p className="t-caption mt-7 border-t border-[var(--color-hairline)] pt-5 text-[var(--color-label-3)]">
        Nos cuesta {formatUsd(estimateCostCents(id, 60) / 100)} producirlo.
      </p>
    </div>
  );
}
