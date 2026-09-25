import Link from "next/link";
import { TEMPLATES } from "@/lib/templates";
import { PRODUCTS, formatUsd } from "@/lib/pricing";
import { LIFE_AREAS } from "@/lib/types";

export const metadata = { title: "Market — Manifest" };

export default function MarketPage() {
  return (
    <div className="mx-auto max-w-[1120px] px-6 py-20">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="t-display">El market</h1>
        <p className="t-body mx-auto mt-6 max-w-lg text-pretty text-[var(--color-label-2)]">
          Vídeos que ha creado otra gente. Eliges uno, le pones tu cara, y se
          genera tu versión: las mismas escenas y el mismo guion, contigo dentro.
        </p>
        <p className="t-caption mx-auto mt-4 max-w-md text-[var(--color-label-3)]">
          Cuesta lo mismo que crear uno de cero. Del precio, un 30 % va a quien lo
          creó.
        </p>
      </header>

      <div className="no-scrollbar mt-14 flex flex-wrap justify-center gap-2">
        <span className="t-caption rounded-full bg-white px-4 py-1.5 font-medium text-black">
          Todos
        </span>
        {LIFE_AREAS.map((a) => (
          <span
            key={a.id}
            className="interactive t-caption cursor-pointer rounded-full border border-[var(--color-hairline)] px-4 py-1.5 text-[var(--color-label-2)]"
          >
            {a.label}
          </span>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((bp) => (
          <Link
            key={bp.slug}
            href={`/market/${bp.slug}`}
            className="card interactive overflow-hidden rounded-[var(--radius-lg)]"
          >
            <div
              className="relative h-48"
              style={{ background: `linear-gradient(150deg, ${bp.cover.from}, ${bp.cover.to})` }}
            >
              {/* Vineta: le quita al degradado el aspecto de relleno plano. */}
              <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_70%_15%,rgba(255,255,255,0.12),transparent_55%),linear-gradient(to_top,rgba(0,0,0,0.45),transparent_60%)]" />
              <span className="t-eyebrow absolute left-4 top-4 rounded-full bg-black/35 px-2.5 py-1.5 text-white/85 backdrop-blur-md">
                {PRODUCTS[bp.tier].name}
              </span>
            </div>
            <div className="p-6">
              <h2 className="t-headline">{bp.title}</h2>
              <p className="t-caption mt-1 text-[var(--color-label-3)]">de {bp.author}</p>
              <p className="t-sub mt-3.5 line-clamp-2 text-[var(--color-label-2)]">
                {bp.summary}
              </p>
              <div className="mt-5 flex items-center justify-between">
                <span className="t-sub font-medium tabular-nums">
                  {formatUsd(PRODUCTS[bp.tier].priceUsd)}
                </span>
                <span className="t-caption tabular-nums text-[var(--color-label-3)]">
                  {bp.durationSec} s
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
