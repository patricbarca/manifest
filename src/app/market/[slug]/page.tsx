import Link from "next/link";
import { notFound } from "next/navigation";
import { BLUEPRINTS, blueprintBySlug } from "@/lib/blueprints";
import { creditCost } from "@/lib/pricing";
import { LIFE_AREAS, VISUAL_STYLES } from "@/lib/types";

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
    <div className="mx-auto max-w-5xl px-5 py-14">
      <Link href="/market" className="text-sm text-white/45 hover:text-white">
        ← Market
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[340px_1fr] lg:items-start">
        <div
          className="aspect-[9/16] rounded-xl2 ring-1 ring-white/10"
          style={{ background: `linear-gradient(150deg, ${bp.cover.from}, ${bp.cover.to})` }}
        />

        <div>
          <p className="text-sm text-gold">
            {area?.label} · {bp.tier === "vision" ? "Visión" : "Cine"}
          </p>
          <h1 className="mt-1 font-display text-4xl leading-tight">{bp.title}</h1>
          <p className="mt-2 text-sm text-white/45">
            de {bp.author} · ★ {bp.rating} · {bp.sales.toLocaleString("es-ES")} personas lo usan
          </p>
          <p className="mt-5 leading-relaxed text-white/65">{bp.summary}</p>

          <div className="card mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl2 p-5">
            <div>
              <p className="font-display text-3xl text-gold">
                {(bp.priceCents / 100).toFixed(2)} €
              </p>
              <p className="mt-1 text-sm text-white/45">
                Pago único. La generación son {creditCost(bp.tier, 60)} créditos aparte.
              </p>
            </div>
            <Link
              href={`/crear?blueprint=${bp.slug}`}
              className="rounded-full bg-gold px-6 py-3 font-medium text-ink-950 transition hover:bg-gold-deep"
            >
              Usar este blueprint
            </Link>
          </div>

          <section className="mt-10">
            <h2 className="font-display text-xl">Las afirmaciones</h2>
            <ol className="mt-4 space-y-2.5">
              {bp.affirmations.map((a, i) => (
                <li key={i} className="flex gap-3 text-white/80">
                  <span className="mt-0.5 w-5 shrink-0 text-right text-xs text-gold">
                    {i + 1}
                  </span>
                  {a}
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl">Las escenas</h2>
            <p className="mt-1 text-sm text-white/40">
              Descripciones en inglés: es el idioma con el que mejor responden los modelos
              de imagen. Estilo {style?.label.toLowerCase()}.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/50">
              {bp.sceneBriefs.map((s, i) => (
                <li key={i} className="rounded-lg border border-white/8 bg-white/3 px-4 py-2.5">
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
