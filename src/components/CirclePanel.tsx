"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Person = { userId: string; handle: string; displayName: string; avatarUrl?: string };
type Labels = { circle: string; circleHint: string; requests: string; members: string; memberOf: string; none: string; accept: string; reject: string; remove: string; leave: string };

export function CirclePanel({ requests, members, memberOf, t }: { requests: Person[]; members: Person[]; memberOf: Person[]; t: Labels }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string>();

  async function act(action: string, userId: string) {
    setBusy(userId + action);
    await fetch("/api/circle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, userId }) });
    setBusy(undefined);
    router.refresh();
  }

  const row = (p: Person, buttons: { label: string; action: string }[]) => (
    <li key={p.userId} className="flex items-center justify-between gap-3 py-2.5">
      <a href={`/u/${p.handle}`} className="flex items-center gap-3">
        {p.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-sm">{(p.displayName || "?")[0].toUpperCase()}</span>
        )}
        <span className="t-sub">{p.displayName} <span className="text-[var(--color-label-3)]">@{p.handle}</span></span>
      </a>
      <span className="flex gap-2">
        {buttons.map((b) => (
          <button key={b.action} type="button" disabled={!!busy} onClick={() => act(b.action, p.userId)} className="t-caption rounded-full border border-[var(--color-hairline-strong)] px-3 py-1 disabled:opacity-50">
            {b.label}
          </button>
        ))}
      </span>
    </li>
  );

  return (
    <section className="card rounded-[var(--radius-lg)] p-7">
      <h2 className="t-headline">{t.circle}</h2>
      <p className="t-caption mt-1 text-[var(--color-label-3)]">{t.circleHint}</p>
      {requests.length > 0 && (
        <>
          <p className="t-caption mt-5 text-[var(--color-label-2)]">{t.requests}</p>
          <ul className="divide-y divide-[var(--color-hairline)]">{requests.map((p) => row(p, [{ label: t.accept, action: "accept" }, { label: t.reject, action: "reject" }]))}</ul>
        </>
      )}
      <p className="t-caption mt-5 text-[var(--color-label-2)]">{t.members}</p>
      {members.length ? (
        <ul className="divide-y divide-[var(--color-hairline)]">{members.map((p) => row(p, [{ label: t.remove, action: "remove" }]))}</ul>
      ) : (
        <p className="t-caption mt-1 text-[var(--color-label-3)]">{t.none}</p>
      )}
      {memberOf.length > 0 && (
        <>
          <p className="t-caption mt-5 text-[var(--color-label-2)]">{t.memberOf}</p>
          <ul className="divide-y divide-[var(--color-hairline)]">{memberOf.map((p) => row(p, [{ label: t.leave, action: "leave" }]))}</ul>
        </>
      )}
    </section>
  );
}
