"use client";

import { useState } from "react";
import type { Highlight } from "@/lib/types";

type Labels = { showOnProfile: string; hiddenScene: string; labelPlaceholder: string; tapToHide: string };

/**
 * Qué se ve de un vídeo en tu perfil: el interruptor del vídeo y, debajo,
 * cada escena (un deseo) para mostrarla u ocultarla y ponerle nombre.
 */
export function ShowcaseEditor({
  projectId,
  title,
  initialShow,
  initialItems,
  t,
}: {
  projectId: string;
  title: string;
  initialShow: boolean;
  initialItems: Highlight[];
  t: Labels;
}) {
  const [show, setShow] = useState(initialShow);
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);

  async function save(body: { show?: boolean; items?: { index: number; hidden?: boolean; label?: string }[] }) {
    setBusy(true);
    const res = await fetch("/api/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, ...body }),
    });
    setBusy(false);
    if (!res.ok) return false;
    const data = await res.json();
    setShow(data.show);
    setItems(data.highlights);
    return true;
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="t-sub min-w-0 truncate">{title}</span>
        <button
          type="button"
          role="switch"
          aria-checked={show}
          aria-label={t.showOnProfile}
          disabled={busy}
          onClick={() => save({ show: !show })}
          className="t-caption inline-flex shrink-0 items-center gap-2 text-[var(--color-label-2)]"
        >
          <span className={`relative h-5 w-9 rounded-full transition-colors ${show ? "bg-emerald-400" : "bg-white/20"}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${show ? "left-[18px]" : "left-0.5"}`} />
          </span>
          {t.showOnProfile}
        </button>
      </div>

      <div className={`mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 ${show ? "" : "opacity-50"}`}>
        {items.map((h, i) => (
          <div key={h.posterUrl} className="space-y-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => save({ items: [{ index: i, hidden: !h.hidden }] })}
              className="relative block aspect-[9/16] w-full overflow-hidden rounded-md"
              title={t.tapToHide}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={h.posterUrl} alt="" className={`h-full w-full object-cover ${h.hidden ? "opacity-30 grayscale" : ""}`} />
              <span className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-[11px] text-white">{h.hidden ? "🙈" : "👁"}</span>
              {h.hidden && <span className="absolute inset-x-0 bottom-1 text-center text-[10px] text-white">{t.hiddenScene}</span>}
            </button>
            <input
              defaultValue={h.label ?? ""}
              maxLength={24}
              placeholder={t.labelPlaceholder}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== (h.label ?? "")) void save({ items: [{ index: i, label: v }] });
              }}
              className="t-caption w-full rounded border border-[var(--color-hairline)] bg-transparent px-1.5 py-1 outline-none focus:border-[var(--color-hairline-strong)]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
