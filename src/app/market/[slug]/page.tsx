import Link from "next/link";
import { notFound } from "next/navigation";
import { TEMPLATES, templateBySlug } from "@/lib/templates";
import { PRODUCTS, formatUsd } from "@/lib/pricing";
import { LIFE_AREAS, VISUAL_STYLES } from "@/lib/types";
import { Icon } from "@/components/Icon";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bp = templateBySlug(slug);
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
            {area?.label} · {PRODUCTS[bp.tier].name} · {bp.durationSec} s
          </p>
          <h1 className="t-title mt-3 text-balance">{bp.title}</h1>
          <p className="t-caption mt-2.5 text-[var(--color-label-3)]">
            de {bp.author}
            {bp.uses > 0 &&
              ` · ${bp.uses.toLocaleString("es-ES")} ${bp.uses === 1 ? "persona lo ha usado" : "personas lo han usado"}`}
          </p>
          <p className="t-body mt-6 text-[var(--color-label-2)]">{bp.summary}</p>

          <div className="card mt-9 flex flex-wrap items-center justify-between gap-5 rounded-[var(--radius-lg)] p-6">
            <div>
              <p className="text-[2rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                {formatUsd(PRODUCTS[bp.tier].priceUsd)}
              </p>
              <p className="t-caption mt-2 text-[var(--color-label-2)]">
                Lo mismo que crear uno de cero. Sin tarifa aparte por la plantilla.
              </p>
            </div>
            <Link
              href={`/crear?template=${bp.slug}`}
              className="interactive rounded-full bg-white px-6 py-2.5 text-[15px] font-medium text-black hover:bg-white/90"
            >
              Usar esta plantilla
            </Link>
          </div>

          {bp.protocol && (
            <section className="mt-12">
              <h2 className="t-headline">Cómo usarlo</h2>
              <p className="t-body mt-3 text-[var(--color-label-2)]">{bp.protocol}</p>
            </section>
          )}

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
