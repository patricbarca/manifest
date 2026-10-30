"use client";

import { useEffect, useState } from "react";
import { BODY_BUILDS, BODY_HEIGHTS, type BodyFeatures as Body } from "@/lib/body";
import type { PhotoGuideLabels } from "./PhotoSlots";

/**
 * Complexión y estatura con botones (opcional). Se guarda en la cuenta al
 * tocar y se añade, en palabras, al prompt de cada escena.
 */
export function BodyFeatures({ t }: { t: PhotoGuideLabels }) {
  const [body, setBody] = useState<Body>({});

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => d?.user?.body && setBody(d.user.body))
      .catch(() => {});
  }, []);

  function save(patch: { build?: Body["build"] | null; height?: Body["height"] | null }) {
    setBody((prev) => ({ build: patch.build === undefined ? prev.build : patch.build ?? undefined, height: patch.height === undefined ? prev.height : patch.height ?? undefined }));
    void fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: patch }) }).catch(() => {});
  }

  const chip = (on: boolean) =>
    `interactive t-caption rounded-full border px-3 py-1.5 ${on ? "border-white bg-white text-black" : "border-[var(--color-hairline-strong)] text-[var(--color-label-2)]"}`;

  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-hairline)] p-3">
      <div>
        <p className="t-sub font-medium">{t.bodyTitle}</p>
        <p className="t-caption text-[var(--color-label-3)]">{t.bodyHint}</p>
      </div>
      <div className="space-y-1.5">
        <p className="t-caption text-[var(--color-label-2)]">{t.bodyBuild}</p>
        <div className="flex flex-wrap gap-1.5">
          {BODY_BUILDS.map((b) => (
            <button key={b} type="button" aria-pressed={body.build === b} onClick={() => save({ build: body.build === b ? null : b })} className={chip(body.build === b)}>
              {t.builds[b]}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="t-caption text-[var(--color-label-2)]">{t.bodyHeight}</p>
        <div className="flex flex-wrap gap-1.5">
          {BODY_HEIGHTS.map((h) => (
            <button key={h} type="button" aria-pressed={body.height === h} onClick={() => save({ height: body.height === h ? null : h })} className={chip(body.height === h)}>
              {t.heights[h]}
            </button>
          ))}
        </div>
      </div>
      {(body.build || body.height) && (
        <button type="button" onClick={() => save({ build: null, height: null })} className="t-caption text-[var(--color-label-3)] underline">
          {t.bodySkip}
        </button>
      )}
    </div>
  );
}
