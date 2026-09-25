import Link from "next/link";
import { Icon } from "@/components/Icon";
import {
  CREATOR_SHARE,
  PRODUCTS,
  creatorPayoutUsd,
  estimateCostCents,
  formatUsd,
} from "@/lib/pricing";

export const metadata = { title: "Precios — Manifest" };

export default function PreciosPage() {
  return (
    <div className="mx-auto max-w-[1120px] px-6 py-20">
      <header className="mx-auto max-w-xl text-center">
        <h1 className="t-display text-balance">Dos precios, y ya</h1>
        <p className="t-body mx-auto mt-6 text-pretty text-[var(--color-label-2)]">
          Pagas por vídeo. Sin suscripción, sin créditos, sin paquetes. El primero
          es gratis para que veas si te resuena.
        </p>
      </header>

      <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-2">
        {(["vision", "cinematic"] as const).map((id) => {
          const product = PRODUCTS[id];
          return (
            <div
              key={id}
              className={`card flex flex-col rounded-[var(--radius-lg)] p-8 ${
                id === "cinematic" ? "border-[var(--color-hairline-strong)]" : ""
              }`}
            >
              <h2 className="t-headline">{product.name}</h2>
              <p className="t-sub mt-1 min-h-10 text-[var(--color-label-2)]">
                {product.tagline}
              </p>

              <p className="mt-7 text-[3rem] font-semibold leading-none tracking-[-0.035em] tabular-nums">
                {formatUsd(product.priceUsd)}
              </p>
              <p className="t-caption mt-2 text-[var(--color-label-2)]">
                por vídeo · 30 o 60 segundos, mismo precio
              </p>

              <ul className="mt-7 flex-1 space-y-2.5">
                {product.points.map((point) => (
                  <li key={point} className="t-sub flex gap-2.5 text-[var(--color-label-2)]">
                    <Icon
                      name="check"
                      size={14}
                      className="mt-[4px] shrink-0 text-[var(--color-label-1)]"
                    />
                    {point}
                  </li>
                ))}
              </ul>

              <p className="t-caption mt-6 text-[var(--color-label-3)]">
                {product.waitLabel}
              </p>

              <Link
                href="/crear"
                className={`interactive mt-7 rounded-full px-5 py-2.5 text-center text-[15px] font-medium tracking-[-0.011em] ${
                  id === "cinematic"
                    ? "bg-white text-black hover:bg-white/90"
                    : "border border-[var(--color-hairline)] text-[var(--color-label-1)]"
                }`}
              >
                Crear
              </Link>
            </div>
          );
        })}
      </div>

      <p className="t-sub mx-auto mt-8 max-w-md text-center text-[var(--color-label-2)]">
        Tu primer vídeo es gratis y lleva una pequeña marca de agua. A partir de
        ahí pagas solo cuando creas.
      </p>

      {/* ── El market ────────────────────────────────────────────────────── */}
      <section className="mx-auto mt-28 max-w-3xl">
        <h2 className="t-title text-center">Y si usas la plantilla de alguien</h2>
        <p className="t-body mx-auto mt-4 max-w-lg text-center text-pretty text-[var(--color-label-2)]">
          Pagas exactamente lo mismo. No hay tarifa aparte por la plantilla: del
          precio del vídeo, un {Math.round(CREATOR_SHARE * 100)} % va a quien la
          creó.
        </p>

        <div className="card mt-10 rounded-[var(--radius-lg)] p-8">
          <h3 className="t-headline">Si publicas las tuyas</h3>
          <p className="t-sub mt-2 leading-relaxed text-[var(--color-label-2)]">
            Cuando termines un vídeo que te guste, puedes publicarlo como
            plantilla. Quien la use genera su propia versión con su cara, y a ti
            te llegan {formatUsd(creatorPayoutUsd("vision"))} por cada vídeo de{" "}
            {PRODUCTS.vision.name.toLowerCase()} y{" "}
            {formatUsd(creatorPayoutUsd("cinematic"))} por cada{" "}
            {PRODUCTS.cinematic.name.toLowerCase()}.
          </p>
          <p className="t-caption mt-4 text-[var(--color-label-3)]">
            Lo que se publica es la receta —guion, escenas, estilo—, no tu vídeo
            montado. Nadie recibe nunca un vídeo con tu cara dentro.
          </p>
        </div>
      </section>

      {/* ── Transparencia de coste ───────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-lg text-center">
        <p className="t-caption leading-relaxed text-[var(--color-label-3)]">
          Para que se vea de dónde salen los números: producir un vídeo de{" "}
          {PRODUCTS.vision.name.toLowerCase()} de 60 s nos cuesta{" "}
          {formatUsd(estimateCostCents("vision", 60) / 100)} en modelos de IA, y
          uno {PRODUCTS.cinematic.name.toLowerCase()} de 60 s,{" "}
          {formatUsd(estimateCostCents("cinematic", 60) / 100)}. La diferencia de
          precio no es un capricho: animar cada escena cuesta entre 30 y 100 veces
          más que generar una imagen.
        </p>
      </section>
    </div>
  );
}
