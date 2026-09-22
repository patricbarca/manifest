import Link from "next/link";
import { notFound } from "next/navigation";
import { BLUEPRINTS, blueprintBySlug } from "@/lib/blueprints";
import { creditCost } from "@/lib/pricing";
import { LIFE_AREAS, VISUAL_STYLES } from "@/lib/types";
import { Icon } from "@/components/Icon";

export function generateStaticParams() {
  return BLUEPRINTS.map((bp) => ({ slug: bp.slug }));
}

export default async function BlueprintPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bp = blueprintBySlug(slug);
  if (!bp) notFound();

  const area = LIFE_AREAS.find((a) => a.id === bp.area);
  const style = VISUAL_STYLES.find((s) => s.id === bp.style);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href="/market"
        className="t-sub inline-flex items-center gap-1.5 text-[var(--color-label-2)] transition-opacity hover:text-[var(--color-label-1)]"
      >
        <Icon name="arrow-left" size={15} />
        Market
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[320px_1fr] lg:items-start">
        <div
          className="aspect-[9/16] rounded-[var(--radius-xl)] ring-1 ring-[var(--color-hairline)]"
          style={{ background: `linear-gradient(150deg, ${bp.cover.from}, ${bp.cover.to})` }}
        />

        <div>
          <p className="t-eyebrow text-[var(--color-label-3)]">
            {area?.label} · {bp.tier === "vision" ? "Visión" : "Cine"}
          </p>
          <h1 className="t-title mt-3 text-balance">{bp.title}</h1>
          <p className="t-caption mt-2.5 tabular-nums text-[var(--color-label-3)]">
            de {bp.author} · {bp.rating} · {bp.sales.toLocaleString("es-ES")} personas lo usan
          </p>
          <p className="t-body mt-6 text-[var(--color-label-2)]">{bp.summary}</p>

          <div className="card mt-9 flex flex-wrap items-center justify-between gap-5 rounded-[var(--radius-lg)] p-6">
            <div>
              <p className="text-[2rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                {(bp.priceCents / 100).toFixed(2)} €
              </p>
              <p className="t-caption mt-2 text-[var(--color-label-2)]">
                Pago único. La generación son {creditCost(bp.tier, 60)} créditos aparte.
              </p>
            </div>
            <Link
              href={`/crear?blueprint=${bp.slug}`}
              className="interactive rounded-full bg-white px-6 py-2.5 text-[15px] font-medium text-black hover:bg-white/90"
            >
              Usar este blueprint
            </Link>
          </div>

          <section className="mt-12">
            <h2 className="t-headline">Las afirmaciones</h2>
            <ol className="mt-5 space-y-3">
              {bp.affirmations.map((a, i) => (
                <li key={i} className="t-body flex gap-3.5">
                  <span className="t-caption mt-[5px] w-4 shrink-0 text-right tabular-nums text-[var(--color-label-3)]">
                    {i + 1}
                  </span>
                  {a}
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12">
            <h2 className="t-headline">Las escenas</h2>
            <p className="t-caption mt-1.5 text-[var(--color-label-3)]">
              Descripciones en inglés: es el idioma con el que mejor responden los modelos
              de imagen. Estilo {style?.label.toLowerCase()}.
            </p>
            <ul className="t-sub mt-5 space-y-2 text-[var(--color-label-2)]">
              {bp.sceneBriefs.map((s, i) => (
                <li
                  key={i}
                  className="rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-3"
                >
                  {s}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
