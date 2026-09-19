import Link from "next/link";
import { BLUEPRINTS } from "@/lib/blueprints";
import { LIFE_AREAS } from "@/lib/types";

export const metadata = { title: "Market — Manifest" };

export default function MarketPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl leading-tight">El market</h1>
        <p className="mt-4 text-white/60">
          Aquí no se venden vídeos acabados, se venden <em>blueprints</em>: el guion, las
          escenas, el estilo y el tono que alguien ya ha afinado. Tú le pones tu cara y
          generas tu propia versión.
        </p>
        <p className="mt-3 text-sm text-white/40">
          Un vídeo con la cara de otra persona no te sirve para visualizarte, y revenderlo
          sería tratar datos biométricos ajenos. El blueprint sí es tuyo desde el momento
          en que lo generas.
        </p>
      </header>

      <div className="mt-10 flex flex-wrap gap-2">
        <span className="rounded-full border border-gold/50 bg-gold/10 px-4 py-1.5 text-sm text-gold">
          Todos
        </span>
        {LIFE_AREAS.map((a) => (
          <span
            key={a.id}
            className="rounded-full border border-white/12 px-4 py-1.5 text-sm text-white/55"
          >
            {a.label}
          </span>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {BLUEPRINTS.map((bp) => (
          <Link
            key={bp.slug}
            href={`/market/${bp.slug}`}
            className="card card-hover overflow-hidden rounded-xl2"
          >
            <div
              className="relative h-44"
              style={{ background: `linear-gradient(140deg, ${bp.cover.from}, ${bp.cover.to})` }}
            >
              <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white/80">
                {bp.tier === "vision" ? "Visión" : "Cine"}
              </span>
            </div>
            <div className="p-5">
              <h2 className="font-medium">{bp.title}</h2>
              <p className="mt-1 text-xs text-white/40">de {bp.author}</p>
              <p className="mt-3 line-clamp-2 text-sm text-white/55">{bp.summary}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gold">{(bp.priceCents / 100).toFixed(2)} €</span>
                <span className="text-white/35">
                  ★ {bp.rating} · {bp.sales.toLocaleString("es-ES")} ventas
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
