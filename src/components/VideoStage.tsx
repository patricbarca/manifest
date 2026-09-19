"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { VisualizationPlayer } from "./VisualizationPlayer";

/**
 * La pantalla del vídeo.
 *
 * Mientras se genera, sondea el proyecto y va enseñando las escenas conforme
 * caen. Enseñar el progreso real (y las primeras imágenes) es lo que hace
 * soportable una espera de minutos en el tier cine.
 */
export function VideoStage({ initial }: { initial: Project }) {
  const [project, setProject] = useState(initial);
  const working = project.status === "queued" || project.status === "generating";

  useEffect(() => {
    if (!working) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { project: Project };
        setProject(data.project);
      } catch {
        /* se reintenta en el siguiente tick */
      }
    }, 1500);
    return () => clearInterval(id);
  }, [working, project.id]);

  if (project.status === "failed") {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="font-display text-3xl">No se pudo terminar tu vídeo</h1>
        <p className="mt-3 text-white/55">{project.error ?? "Error desconocido"}</p>
        <p className="mt-2 text-sm text-white/40">
          Si no llegó a generarse ninguna escena, tus créditos se han devuelto.
        </p>
        <Link
          href="/crear"
          className="mt-8 inline-block rounded-full bg-gold px-6 py-3 font-medium text-ink-950"
        >
          Intentarlo otra vez
        </Link>
      </div>
    );
  }

  if (working) return <GenerationProgress project={project} />;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
        <VisualizationPlayer project={project} />

        <div className="space-y-8">
          <div>
            <p className="text-sm text-gold">{project.tier === "vision" ? "Visión" : "Cine"} · {project.durationSec} s</p>
            <h1 className="mt-1 font-display text-3xl leading-tight">{project.title}</h1>
            <p className="mt-3 text-white/55">{project.intention}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {project.exportUrl ? (
              <a
                href={project.exportUrl}
                download
                className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink-950 transition hover:bg-gold-deep"
              >
                Descargar MP4
              </a>
            ) : (
              <span className="rounded-full border border-white/12 px-6 py-3 text-sm text-white/40">
                Descarga MP4 no disponible en este entorno
              </span>
            )}
            <Link
              href="/crear"
              className="rounded-full border border-white/15 px-6 py-3 text-sm transition hover:border-white/35"
            >
              Crear otro
            </Link>
          </div>

          {/* El guion en texto: mucha gente lo imprime o lo lee sin el vídeo. */}
          <div className="card rounded-xl2 p-6">
            <h2 className="font-display text-xl">Tu guion</h2>
            <p className="mt-1 text-sm text-white/45">
              Léelo en voz alta por la mañana aunque no pongas el vídeo.
            </p>
            <ol className="mt-5 space-y-3">
              {project.affirmations.map((a, i) => (
                <li key={i} className="flex gap-3 text-white/85">
                  <span className="mt-0.5 w-5 shrink-0 text-right text-xs text-gold">
                    {i + 1}
                  </span>
                  {a.text}
                </li>
              ))}
            </ol>
            {project.script?.closing && (
              <p className="mt-5 border-t border-white/8 pt-4 font-display text-lg text-gold">
                {project.script.closing}
              </p>
            )}
          </div>

          <div>
            <h2 className="mb-3 font-display text-xl">Escenas</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {project.scenes.map((s) =>
                s.imageUrl ? (
                  <img
                    key={s.id}
                    src={s.imageUrl}
                    alt=""
                    className="aspect-[9/16] w-full rounded-lg object-cover ring-1 ring-white/10"
                  />
                ) : null,
              )}
            </div>
          </div>

          <CostPanel project={project} />
        </div>
      </div>
    </div>
  );
}

function GenerationProgress({ project }: { project: Project }) {
  const done = project.steps.filter((s) => s.status === "done" || s.status === "skipped").length;
  const pct = Math.round((done / project.steps.length) * 100);
  const preview = project.scenes.filter((s) => s.imageUrl);

  return (
    <div className="mx-auto max-w-xl px-5 py-20">
      <h1 className="font-display text-3xl leading-tight">Estamos creando tu vídeo</h1>
      <p className="mt-2 text-white/50">
        {project.tier === "cinematic"
          ? "El tier Cine tarda unos minutos: cada escena se anima por separado."
          : "Suele tardar menos de dos minutos."}
      </p>

      <div className="mt-8 h-1 w-full overflow-hidden rounded bg-white/10">
        <div
          className="h-full rounded bg-gold transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-8 space-y-4">
        {project.steps.map((step) => (
          <li key={step.id} className="flex items-start gap-3">
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${
                step.status === "done"
                  ? "bg-gold text-ink-950"
                  : step.status === "running"
                    ? "breathe bg-gold/30 text-gold"
                    : step.status === "failed"
                      ? "bg-red-500/80"
                      : "bg-white/10 text-white/40"
              }`}
            >
              {step.status === "done" ? "✓" : step.status === "skipped" ? "–" : ""}
            </span>
            <div>
              <p
                className={
                  step.status === "pending" || step.status === "skipped"
                    ? "text-white/35"
                    : "text-white/85"
                }
              >
                {step.label}
              </p>
              {step.error && <p className="text-xs text-white/40">{step.error}</p>}
            </div>
          </li>
        ))}
      </ul>

      {preview.length > 0 && (
        <div className="mt-10">
          <p className="mb-3 text-sm text-white/45">Primeras escenas</p>
          <div className="grid grid-cols-4 gap-2">
            {preview.map((s) => (
              <img
                key={s.id}
                src={s.imageUrl}
                alt=""
                className="fade-up aspect-[9/16] w-full rounded-lg object-cover ring-1 ring-white/10"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Transparencia de coste. En producción esto va detrás de un flag interno. */
function CostPanel({ project }: { project: Project }) {
  return (
    <details className="card rounded-xl2 p-5 text-sm">
      <summary className="cursor-pointer text-white/55">Detalle de producción</summary>
      <dl className="mt-4 space-y-2 text-white/60">
        <Row label="Créditos gastados" value={`${project.creditsSpent}`} />
        <Row label="Coste de proveedor" value={`${(project.costCents / 100).toFixed(3)} $`} />
        <Row label="Escenas" value={`${project.scenes.length}`} />
        <Row
          label="Voz"
          value={project.voiceMode === "browser" ? "sintetizada en el navegador (demo)" : "pista generada"}
        />
      </dl>
    </details>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="tabular-nums text-white/85">{value}</dd>
    </div>
  );
}
