"use client";

import Link from "next/link";
import { useState } from "react";
import { TemplateMedia, type PreviewVariant } from "./TemplateMedia";
import type { Template } from "@/lib/types";

/**
 * Tarjeta del market con el mismo ejemplo en Imágenes y en Animado: se
 * cambia con el selector de arriba para ver la diferencia antes de elegir.
 */
export function TemplateCard({
  template,
  title,
  summary,
  by,
  referenceLabel,
  membersBadge,
  options,
}: {
  template: Pick<Template, "slug" | "tier" | "cover" | "author" | "membersOnly">;
  title: string;
  summary: string;
  by: string;
  referenceLabel: string;
  membersBadge: string;
  options: { variant: PreviewVariant; label: string; price: string }[];
}) {
  const [variant, setVariant] = useState<PreviewVariant>(
    template.tier === "vision" ? "stills" : "animated",
  );
  const current = options.find((o) => o.variant === variant) ?? options[0];
  const href = `/market/${template.slug}`;

  return (
    <div className="card interactive relative overflow-hidden rounded-[var(--radius-lg)]">
      <Link href={href} className="block">
        <div className="relative aspect-[4/5]">
          <TemplateMedia template={template} variant={variant} className="absolute inset-0 h-full w-full" />
          {/* Viñeta: le quita al degradado el aspecto de relleno plano. */}
          <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_70%_15%,rgba(255,255,255,0.12),transparent_55%),linear-gradient(to_top,rgba(0,0,0,0.45),transparent_60%)]" />
          {template.membersOnly && (
            <span className="t-eyebrow absolute right-4 top-4 rounded-full bg-white px-2.5 py-1.5 text-black">
              {membersBadge}
            </span>
          )}
        </div>
        <div className="p-6">
          <h2 className="t-headline">{title}</h2>
          <p className="t-caption mt-1 text-[var(--color-label-3)]">
            {by} {template.author}
          </p>
          <p className="t-sub mt-3.5 line-clamp-2 text-[var(--color-label-2)]">{summary}</p>
          <div className="mt-5 flex items-center justify-between">
            <span className="t-sub font-medium tabular-nums">{current.price}</span>
            <span className="t-caption tabular-nums text-[var(--color-label-3)]">
              {referenceLabel}
            </span>
          </div>
        </div>
      </Link>

      {/* Fuera del enlace: cambiar de versión no abre la ficha. */}
      <div
        role="tablist"
        className="absolute left-3 top-3 flex rounded-full bg-black/45 p-1 backdrop-blur-md"
      >
        {options.map((o) => (
          <button
            key={o.variant}
            role="tab"
            type="button"
            aria-selected={variant === o.variant}
            onClick={() => setVariant(o.variant)}
            className={`t-eyebrow rounded-full px-2.5 py-1 transition-colors ${
              variant === o.variant ? "bg-white text-black" : "text-white/80 hover:text-white"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
