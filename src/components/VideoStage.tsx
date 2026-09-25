"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { VisualizationPlayer } from "./VisualizationPlayer";
import { Icon } from "./Icon";
import { formatUsd } from "@/lib/pricing";
import type { Dictionary } from "@/lib/i18n";

/**
 * La pantalla del vídeo.
 *
 * Mientras se genera, sondea el proyecto y va enseñando las escenas conforme
 * caen. Enseñar el progreso real (y las primeras imágenes) es lo que hace
 * soportable una espera de minutos en el tier cine.
 */
export function VideoStage({ initial, t }: { initial: Project; t: Dictionary }) {
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
      <div className="mx-auto max-w-lg px-6 py-28 text-center">
        <h1 className="t-title">{t.video.failedTitle}</h1>
        <p className="t-body mt-4 text-[var(--color-label-2)]">
          {project.error ?? t.video.failedUnknown}
        </p>
        <p className="t-caption mt-2 text-[var(--color-label-3)]">
          {t.video.failedRefund}
        </p>
        <Link
          href="/crear"
          className="interactive mt-9 inline-block rounded-full bg-white px-6 py-2.5 text-[15px] font-medium text-black"
        >
          {t.video.tryAgain}
        </Link>
      </div>
    );
  }

  if (working) return <GenerationProgress project={project} t={t} />;

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-14">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
        <VisualizationPlayer project={project} t={t} />

        <div className="space-y-8">
          <div>
            <p className="t-eyebrow text-[var(--color-label-3)]">
              {t.products[project.tier].name} · {project.durationSec} {t.common.seconds}
            </p>
            <h1 className="t-title mt-3 text-balance">{project.title}</h1>
            {/* Sin LLM el titulo sale de la intencion, y entonces repetirla sobra. */}
            {!project.intention.startsWith(project.title.replace(/…$/, "")) && (
              <p className="t-body mt-3 text-[var(--color-label-2)]">{project.intention}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {project.exportUrl ? (
              <a
                href={project.exportUrl}
                download
                className="interactive inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black hover:bg-white/90"
              >
                <Icon name="download" size={16} />
                {t.video.download}
              </a>
            ) : (
              <span className="t-sub rounded-full border border-[var(--color-hairline)] px-5 py-2.5 text-[var(--color-label-3)]">
                {t.video.downloadUnavailable}
              </span>
            )}
            <Link
              href="/crear"
              className="interactive t-sub rounded-full border border-[var(--color-hairline)] px-5 py-2.5 text-[var(--color-label-1)]"
            >
              {t.common.createAnother}
            </Link>
          </div>

          {/* El guion en texto: mucha gente lo imprime o lo lee sin el vídeo. */}
          <div className="card rounded-[var(--radius-lg)] p-7">
            <h2 className="t-headline">{t.video.scriptTitle}</h2>
            <p className="t-sub mt-1 text-[var(--color-label-2)]">{t.video.scriptNote}</p>
            <ol className="mt-6 space-y-3.5">
              {project.affirmations.map((a, i) => (
                <li key={i} className="t-body flex gap-3.5">
                  <span className="t-caption mt-[5px] w-4 shrink-0 text-right tabular-nums text-[var(--color-label-3)]">
                    {i + 1}
                  </span>
                  {a.text}
                </li>
              ))}
            </ol>
            {project.script?.closing && (
              <p className="t-body mt-6 border-t border-[var(--color-hairline)] pt-5 font-medium">
                {project.script.closing}
              </p>
            )}
          </div>

          <div>
            <h2 className="t-headline mb-4">{t.video.scenesTitle}</h2>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {project.scenes.map((s) =>
                s.imageUrl ? (
                  <img
                    key={s.id}
                    src={s.imageUrl}
                    alt=""
                    className="aspect-[9/16] w-full rounded-[var(--radius-ctl)] object-cover ring-1 ring-[var(--color-hairline)]"
                  />
                ) : null,
              )}
            </div>
          </div>

          <CostPanel project={project} t={t} />
        </div>
      </div>
    </div>
  );
}

function GenerationProgress({ project, t }: { project: Project; t: Dictionary }) {
  const done = project.steps.filter((s) => s.status === "done" || s.status === "skipped").length;
  const pct = Math.round((done / project.steps.length) * 100);
  const preview = project.scenes.filter((s) => s.imageUrl);

  return (
    <div className="mx-auto max-w-xl px-6 py-24">
      <h1 className="t-title text-balance">{t.video.generatingTitle}</h1>
      <p className="t-body mt-3 text-[var(--color-label-2)]">
        {project.tier === "cinematic"
          ? t.video.generatingAnimated
          : t.video.generatingStills}
      </p>

      <div className="mt-10 h-[3px] w-full overflow-hidden rounded-full bg-white/12">
        <div
          className="h-full rounded-full bg-white transition-[width] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-10 space-y-5">
        {project.steps.map((step) => (
          <li key={step.id} className="flex items-start gap-3">
            <span
              className={`mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full transition-colors duration-300 ${
                step.status === "done"
                  ? "bg-white text-black"
                  : step.status === "running"
                    ? "pulse-soft border border-white/70"
                    : step.status === "failed"
                      ? "bg-red-500/80"
                      : "border border-[var(--color-hairline)]"
              }`}
            >
              {step.status === "done" && <Icon name="check" size={11} />}
              {step.status === "skipped" && (
                <span className="h-px w-2 bg-[var(--color-label-4)]" />
              )}
            </span>
            <div>
              <p
                className={`t-body ${
                  step.status === "pending" || step.status === "skipped"
                    ? "text-[var(--color-label-3)]"
                    : "text-[var(--color-label-1)]"
                }`}
              >
                {t.video.steps[step.id]}
              </p>
              {step.error && (
                <p className="t-caption mt-0.5 text-[var(--color-label-3)]">{step.error}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {preview.length > 0 && (
        <div className="mt-12">
          <p className="t-sub mb-3 text-[var(--color-label-2)]">{t.video.firstScenes}</p>
          <div className="grid grid-cols-4 gap-2.5">
            {preview.map((s) => (
              <img
                key={s.id}
                src={s.imageUrl}
                alt=""
                className="rise aspect-[9/16] w-full rounded-[var(--radius-ctl)] object-cover ring-1 ring-[var(--color-hairline)]"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Transparencia de coste. En producción esto va detrás de un flag interno. */
function CostPanel({ project, t }: { project: Project; t: Dictionary }) {
  return (
    <details className="card rounded-[var(--radius-md)] p-5">
      <summary className="t-sub cursor-pointer text-[var(--color-label-2)]">
        {t.video.detailsTitle}
      </summary>
      <dl className="t-sub mt-4 space-y-2.5 text-[var(--color-label-2)]">
        <Row
          label={t.video.paid}
          value={
            project.paidCents === 0
              ? t.video.freeLabel
              : formatUsd(project.paidCents / 100)
          }
        />
        <Row
          label={t.video.providerCost}
          value={`$${(project.costCents / 100).toFixed(3)}`}
        />
        <Row label={t.video.sceneCount} value={`${project.scenes.length}`} />
        <Row
          label={t.video.voiceLabel}
          value={project.voiceMode === "browser" ? t.video.voiceBrowser : t.video.voiceFile}
        />
      </dl>
    </details>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="tabular-nums text-[var(--color-label-1)]">{value}</dd>
    </div>
  );
}
