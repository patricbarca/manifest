"use client";

import { useEffect, useState, type ReactNode } from "react";
import { templatePreview } from "@/lib/templates";
import type { Tier } from "@/lib/types";

/** Los mismos 3 ejemplos en los tres tipos, para que se note la diferencia. */
const SLUGS = ["fundadora-en-lisboa", "despegar", "primer-millon"];
/** Lo que dura cada clip: los tres tipos cambian de ejemplo a la vez. */
const STEP_MS = 8000;

/**
 * Los tres tipos de escena uno al lado del otro, cada uno pasando por los
 * mismos 3 ejemplos en sincronía:
 * - vision: el fotograma con movimiento de cámara (lo que se entrega).
 * - cinematic: el clip animado.
 * - elevated: el mismo clip con el modelo premium, en HD.
 * Debajo de cada uno, sus precios según la cantidad de deseos.
 */
export function TierExamples({
  tiers,
  children,
}: {
  tiers: { tier: Tier; name: string; tagline: string }[];
  /** Lo que va bajo cada vídeo (sus precios). */
  children: (tier: Tier) => ReactNode;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % SLUGS.length), STEP_MS);
    return () => clearInterval(id);
  }, []);

  const p = templatePreview(SLUGS[i]);

  return (
    <div className="space-y-4">
      {/* En móvil se desliza de lado; desde sm, las tres columnas a la vez. */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0">
        {tiers.map(({ tier, name, tagline }) => (
          <div
            key={tier}
            className="card flex w-[72%] shrink-0 snap-center flex-col overflow-hidden rounded-[var(--radius-lg)] sm:w-auto"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-black">
              {tier === "vision" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p.still ?? p.poster} alt="" className="kb-loop h-full w-full object-cover" />
              ) : (
                <video
                  key={i}
                  src={tier === "elevated" ? (p.hd ?? p.video) : p.video}
                  poster={p.poster}
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="t-headline">{name}</h3>
              <p className="t-caption mt-0.5 text-[var(--color-label-2)]">{tagline}</p>
              <div className="mt-4 flex-1">{children(tier)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5">
        {SLUGS.map((s, n) => (
          <span key={s} className={`h-1.5 rounded-full transition-all ${n === i ? "w-5 bg-white" : "w-1.5 bg-white/30"}`} />
        ))}
      </div>
    </div>
  );
}
