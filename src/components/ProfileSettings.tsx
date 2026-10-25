"use client";

import { useState } from "react";
import type { Profile, Visibility } from "@/lib/social/types";

type Labels = {
  settings: string; displayName: string; handle: string; handleHint: string; visibility: string;
  visibilityOptions: Record<Visibility, string>; visibilityHint: string; save: string; saved: string;
  errors: Record<string, string>; shareLink: string; copy: string; copied: string;
};

export function ProfileSettings({ initial, origin, t }: { initial: Profile; origin: string; t: Labels }) {
  const [p, setP] = useState(initial);
  const [msg, setMsg] = useState<string>();
  const [busy, setBusy] = useState(false);
  const link = `${origin}/u/${p.handle}`;
  const input = "t-body w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-3 outline-none focus:border-[var(--color-hairline-strong)]";

  async function save() {
    setBusy(true);
    setMsg(undefined);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: p.displayName, handle: p.handle, visibility: p.visibility }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(t.errors[data.error] ?? t.errors.invalid);
    setP(data.profile);
    setMsg(t.saved);
  }

  return (
    <section className="card rounded-[var(--radius-lg)] p-7">
      <h2 className="t-headline">{t.settings}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="t-caption mb-1.5 block text-[var(--color-label-2)]">{t.displayName}</span>
          <input value={p.displayName} maxLength={40} onChange={(e) => setP({ ...p, displayName: e.target.value })} className={input} />
        </label>
        <label className="block">
          <span className="t-caption mb-1.5 block text-[var(--color-label-2)]">{t.handle}</span>
          <input value={p.handle} maxLength={24} onChange={(e) => setP({ ...p, handle: e.target.value.toLowerCase() })} className={input} />
          <span className="t-caption mt-1 block text-[var(--color-label-3)]">{t.handleHint}</span>
        </label>
      </div>

      <p className="t-caption mb-2 mt-6 text-[var(--color-label-2)]">{t.visibility}</p>
      <div className="grid grid-cols-3 gap-2">
        {(["private", "circle", "public"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setP({ ...p, visibility: v })}
            className={`t-sub rounded-[var(--radius-md)] border px-3 py-2.5 ${p.visibility === v ? "border-white ring-1 ring-white" : "border-[var(--color-hairline)]"}`}
          >
            {t.visibilityOptions[v]}
          </button>
        ))}
      </div>
      <p className="t-caption mt-2 text-[var(--color-label-3)]">{t.visibilityHint}</p>

      {p.visibility !== "private" && (
        <div className="mt-5 flex items-center gap-2">
          <span className="t-caption text-[var(--color-label-2)]">{t.shareLink}:</span>
          <code className="t-caption truncate rounded bg-white/5 px-2 py-1">{link}</code>
          <button type="button" onClick={() => { void navigator.clipboard.writeText(link); setMsg(t.copied); }} className="t-caption underline">
            {t.copy}
          </button>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className="interactive rounded-full bg-white px-6 py-2.5 text-[15px] font-medium text-black disabled:opacity-50">
          {t.save}
        </button>
        {msg && <span className="t-caption text-[var(--color-label-2)]">{msg}</span>}
      </div>
    </section>
  );
}
