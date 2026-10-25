"use client";

import { useRef, useState } from "react";
import type { Profile, Visibility } from "@/lib/social/types";

type Labels = {
  settings: string; displayName: string; handle: string; handleHint: string; visibility: string;
  visibilityOptions: Record<Visibility, string>; visibilityHint: string; save: string; saved: string;
  errors: Record<string, string>; shareLink: string; copy: string; copied: string;
  photo: string; changePhoto: string; uploading: string; bio: string; bioHint: string; mantra: string; mantraPlaceholder: string;
  link: string; linkPlaceholder: string; location: string; locationPlaceholder: string; viewProfile: string;
};

export function ProfileSettings({ initial, origin, t }: { initial: Profile; origin: string; t: Labels }) {
  const [p, setP] = useState(initial);
  const [msg, setMsg] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const link = `${origin}/u/${p.handle}`;
  const input = "t-body w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-3 outline-none focus:border-[var(--color-hairline-strong)]";

  async function save() {
    setBusy(true);
    setMsg(undefined);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: p.displayName,
        handle: p.handle,
        visibility: p.visibility,
        bio: p.bio ?? "",
        mantra: p.mantra ?? "",
        link: p.link ?? "",
        location: p.location ?? "",
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(t.errors[data.error] ?? t.errors.invalid);
    setP(data.profile);
    setMsg(t.saved);
  }

  async function upload(file: File) {
    setUploading(true);
    setMsg(undefined);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) return setMsg(t.errors[data.error] ?? t.errors.invalid);
    setP((cur) => ({ ...cur, avatarUrl: data.profile.avatarUrl }));
    setMsg(t.saved);
  }

  return (
    <section className="card rounded-[var(--radius-lg)] p-7">
      <div className="flex items-center gap-4">
        {p.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/10 text-xl">{(p.displayName || "?")[0].toUpperCase()}</span>
        )}
        <div>
          <p className="t-caption text-[var(--color-label-2)]">{t.photo}</p>
          <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="t-sub mt-1 underline disabled:opacity-50">
            {uploading ? t.uploading : t.changePhoto}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
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

      <label className="mt-4 block">
        <span className="t-caption mb-1.5 block text-[var(--color-label-2)]">{t.mantra}</span>
        <input value={p.mantra ?? ""} maxLength={80} placeholder={t.mantraPlaceholder} onChange={(e) => setP({ ...p, mantra: e.target.value })} className={input} />
      </label>
      <label className="mt-4 block">
        <span className="t-caption mb-1.5 block text-[var(--color-label-2)]">{t.bio}</span>
        <textarea value={p.bio ?? ""} maxLength={160} rows={3} onChange={(e) => setP({ ...p, bio: e.target.value })} className={`${input} resize-none`} />
        <span className="t-caption mt-1 block text-[var(--color-label-3)]">{t.bioHint} {(p.bio ?? "").length}/160</span>
      </label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="t-caption mb-1.5 block text-[var(--color-label-2)]">{t.link}</span>
          <input type="url" value={p.link ?? ""} maxLength={200} placeholder={t.linkPlaceholder} onChange={(e) => setP({ ...p, link: e.target.value })} className={input} />
        </label>
        <label className="block">
          <span className="t-caption mb-1.5 block text-[var(--color-label-2)]">{t.location}</span>
          <input value={p.location ?? ""} maxLength={40} placeholder={t.locationPlaceholder} onChange={(e) => setP({ ...p, location: e.target.value })} className={input} />
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
        <a href="/perfil" className="t-caption ml-auto underline">{t.viewProfile}</a>
      </div>
    </section>
  );
}
