"use client";

import { useState } from "react";
import { funnel } from "@/lib/track-client";

/**
 * Landing de anuncios: escribe (o toca un ejemplo) lo que quieres vivir y
 * entra a crear tu escena con el deseo ya escrito (/new?wish=…, más las UTM).
 * Sin escribir nada también vale: va a /new tal cual.
 */
export function StartWish({ utm, examples, t }: { utm: Record<string, string>; examples: string[]; t: { label: string; placeholder: string; cta: string } }) {
  const [wish, setWish] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    const w = wish.trim().slice(0, 200);
    if (w) q.set("wish", w);
    for (const [k, v] of Object.entries(utm)) q.set(k, v);
    funnel("cta_click", { from: "start" });
    const s = q.toString();
    window.location.href = s ? `/new?${s}` : "/new";
  }

  return (
    <form action="/new" method="get" onSubmit={go} className="mx-auto max-w-md text-left">
      <label htmlFor="wish" className="t-headline block text-center">{t.label}</label>
      <input
        id="wish"
        name="wish"
        value={wish}
        onChange={(e) => setWish(e.target.value)}
        maxLength={200}
        autoComplete="off"
        placeholder={t.placeholder}
        className="t-body mt-3 w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-3 outline-none placeholder:text-[var(--color-label-4)] focus:border-[var(--color-hairline-strong)]"
      />
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {examples.map((x) => (
          <button key={x} type="button" onClick={() => setWish(x)} className="interactive t-caption rounded-full border border-[var(--color-hairline)] px-3 py-1.5 text-[var(--color-label-2)] hover:text-[var(--color-label-1)]">
            {x}
          </button>
        ))}
      </div>
      {Object.entries(utm).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="mt-6 text-center">
        <button type="submit" className="interactive inline-block rounded-full bg-white px-7 py-3.5 text-[16px] font-semibold tracking-[-0.011em] text-black hover:bg-white/90">
          {t.cta}
        </button>
      </div>
    </form>
  );
}
