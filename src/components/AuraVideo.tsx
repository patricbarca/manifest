"use client";

import { useRef, useState } from "react";

type Labels = { earned: string; already: string; streak: string; streakOne: string; noSkip: string };

/**
 * El vídeo final con seguimiento de aura: al empezar avisa al servidor y al
 * llegar al 80 % pide el aura del día. El servidor decide si cuenta.
 */
export function AuraVideo({ projectId, src, labels }: { projectId: string; src: string; labels: Labels }) {
  const started = useRef(false);
  const done = useRef(false);
  // Hasta dónde lo ha visto de verdad: no se puede saltar más allá (sí volver atrás).
  const watched = useRef(0);
  const [toast, setToast] = useState<string>();

  function onPlay() {
    if (started.current) return;
    started.current = true;
    void fetch("/api/aura/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    }).catch(() => undefined);
  }

  /** Si intenta adelantar, vuelve a donde iba. */
  function onSeeking(e: React.SyntheticEvent<HTMLVideoElement>) {
    const v = e.currentTarget;
    // Con el aura de hoy ya pedida, puede moverse libremente.
    if (done.current) return;
    if (v.currentTime > watched.current + 1) v.currentTime = watched.current;
  }

  async function onTime(e: React.SyntheticEvent<HTMLVideoElement>) {
    const v = e.currentTarget;
    // Avanza solo reproduciendo (saltos pequeños de la línea de tiempo, no búsquedas).
    if (!v.seeking && v.currentTime > watched.current && v.currentTime - watched.current < 1.5) watched.current = v.currentTime;
    if (done.current || !v.duration || watched.current / v.duration < 0.8) return;
    done.current = true;
    try {
      const res = await fetch("/api/aura/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, tz: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { awarded?: boolean; points?: number; streak?: number; reason?: string };
      if (data.reason === "too_fast") {
        done.current = false; // saltó adelante: que siga viendo
        return;
      }
      setToast(
        data.awarded
          ? `${labels.earned.replace("{n}", String(data.points ?? 10))} · ${(data.streak ?? 1) === 1 ? labels.streakOne : labels.streak.replace("{n}", String(data.streak))}`
          : labels.already,
      );
      setTimeout(() => setToast(undefined), 6000);
    } catch {
      done.current = false;
    }
  }

  return (
    <div className="relative">
      <video
        src={src}
        controls
        playsInline
        onPlay={onPlay}
        onTimeUpdate={onTime}
        onSeeking={onSeeking}
        className="aspect-[9/16] w-full rounded-[var(--radius-lg)] bg-black"
      />
      <p className="t-caption mt-2 text-center text-[var(--color-label-3)]">{labels.noSkip}</p>
      {toast && (
        <div className="t-sub absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-4 py-2 text-white backdrop-blur">
          ✨ {toast}
        </div>
      )}
    </div>
  );
}
