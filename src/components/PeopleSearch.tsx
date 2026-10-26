"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Person = { handle: string; displayName: string; avatarUrl?: string; visibility: "circle" | "public" };

/** Buscador de personas para unirse a su círculo. */
export function PeopleSearch({ t }: { t: { placeholder: string; none: string; circleOnly: string } }) {
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setPeople([]);
      setSearched(false);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      const res = await fetch(`/api/people?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal }).catch(() => null);
      if (!res?.ok) return;
      setPeople((await res.json()).people);
      setSearched(true);
    }, 300);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t.placeholder}
        className="t-body w-full rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-2.5 outline-none focus:border-[var(--color-hairline-strong)]"
      />
      {searched && people.length === 0 && <p className="t-caption mt-3 text-[var(--color-label-3)]">{t.none}</p>}
      <ul className="mt-2 divide-y divide-[var(--color-hairline)]">
        {people.map((p) => (
          <li key={p.handle}>
            <Link href={`/u/${p.handle}`} className="flex items-center gap-3 py-2.5">
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm">{(p.displayName || "?")[0].toUpperCase()}</span>
              )}
              <span className="min-w-0">
                <span className="t-sub block truncate">{p.displayName}</span>
                <span className="t-caption block truncate text-[var(--color-label-3)]">
                  @{p.handle}
                  {p.visibility === "circle" && <> · 🔒 {t.circleOnly}</>}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
