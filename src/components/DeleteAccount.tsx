"use client";

import { useRef, useState } from "react";

type Labels = { open: string; hint: string; confirm: string; word: string; button: string; deleting: string; busy: string; failed: string; cancel: string };

/** Borrar la cuenta: hay que escribir la palabra (BORRAR / DELETE) y no se puede deshacer. */
export function DeleteAccount({ t }: { t: Labels }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const logout = useRef<HTMLFormElement>(null);

  async function remove() {
    setBusy(true);
    setErr(undefined);
    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    }).catch(() => null);
    if (res?.ok) return logout.current?.submit();
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    setErr(data?.error === "busy" ? t.busy : t.failed);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="t-sub text-rose-300 underline-offset-4 hover:underline">
        {t.open}
      </button>
    );
  }
  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-rose-400/40 p-4">
      <p className="t-caption text-[var(--color-label-2)]">{t.hint}</p>
      <label className="block">
        <span className="t-caption text-[var(--color-label-2)]">{t.confirm}</span>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          className="t-body mt-1 w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-1)] px-3 py-2 outline-none"
        />
      </label>
      {err && <p className="t-caption text-rose-300">{err}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || typed.trim().toUpperCase() !== t.word}
          onClick={remove}
          className="interactive t-sub flex-1 rounded-full bg-rose-500 px-4 py-2 font-medium text-white disabled:opacity-40"
        >
          {busy ? t.deleting : t.button}
        </button>
        <button type="button" disabled={busy} onClick={() => setOpen(false)} className="t-sub rounded-full bg-white/10 px-4 py-2">
          {t.cancel}
        </button>
      </div>
      {/* Tras borrar, se cierra la sesión (la cookie ya no sirve). */}
      <form ref={logout} action="/auth/logout" method="post" className="hidden" />
    </div>
  );
}
