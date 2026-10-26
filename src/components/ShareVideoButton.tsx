"use client";

import { useState } from "react";

/**
 * Compartir un vídeo: crea un enlace público que solo enseña las escenas
 * animadas (sin voz ni frases) con un botón para que quien lo vea cree el suyo.
 */
export function ShareVideoButton({
  projectId,
  initial,
  t,
}: {
  projectId: string;
  initial: boolean;
  t: { share: string; copied: string; stop: string; hint: string };
}) {
  const [shared, setShared] = useState(initial);
  const [msg, setMsg] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function toggle(on: boolean) {
    setBusy(true);
    const res = await fetch("/api/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, on }) });
    setBusy(false);
    if (!res.ok) return false;
    setShared(on);
    return true;
  }

  async function share() {
    if (!shared && !(await toggle(true))) return;
    const url = `${window.location.origin}/s/${projectId}`;
    try {
      if (navigator.share) {
        await navigator.share({ url });
        return;
      }
    } catch {
      return;
    }
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setMsg(t.copied);
    setTimeout(() => setMsg(undefined), 2000);
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={share} disabled={busy} className="interactive t-sub rounded-full border border-[var(--color-hairline)] px-5 py-2.5 text-[var(--color-label-1)]">
          ↗ {msg ?? t.share}
        </button>
        {shared && (
          <button type="button" onClick={() => toggle(false)} disabled={busy} className="t-caption text-[var(--color-label-3)] underline">
            {t.stop}
          </button>
        )}
      </div>
      <p className="t-caption mt-2 text-[var(--color-label-3)]">{t.hint}</p>
    </div>
  );
}
