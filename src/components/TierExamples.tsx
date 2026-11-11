"use client";

import { useEffect, useState } from "react";
import { templatePreview } from "@/lib/templates";
import type { Tier } from "@/lib/types";

/** Los mismos 3 ejemplos en las tres pestañas, para que se note la diferencia. */
const SLUGS = ["fundadora-en-lisboa", "despegar", "primer-millon"];
/** Cuánto se queda cada foto con movimiento antes de pasar a la siguiente. */
const STILL_MS = 5000;

/**
 * Muestra de un tipo de escena: 3 ejemplos seguidos, en bucle.
 * - vision: el fotograma con movimiento de cámara (lo que se entrega).
 * - cinematic: el clip animado.
 * - elevated: el mismo clip con el modelo premium, en HD.
 */
export function TierExamples({ tier }: { tier: Tier }) {
  // Al cambiar de pestaña, se empieza de nuevo por el primero.
  return <Player key={tier} tier={tier} />;
}

function Player({ tier }: { tier: Tier }) {
  const [i, setI] = useState(0);
  const next = () => setI((n) => (n + 1) % SLUGS.length);

  // Las fotos no tienen "fin": se pasan con un temporizador.
  useEffect(() => {
    if (tier !== "vision") return;
    const id = setTimeout(() => setI((n) => (n + 1) % SLUGS.length), STILL_MS);
    return () => clearTimeout(id);
  }, [tier, i]);

  const p = templatePreview(SLUGS[i]);

  return (
    <div className="mx-auto w-full max-w-[220px]">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-black">
        {tier === "vision" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.still} src={p.still ?? p.poster} alt="" className="kb-loop h-full w-full object-cover" />
        ) : (
          <video
            key={i}
            src={tier === "elevated" ? (p.hd ?? p.video) : p.video}
            poster={p.poster}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={next}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {SLUGS.map((s, n) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${n === i ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
