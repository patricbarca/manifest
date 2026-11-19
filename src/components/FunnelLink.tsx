"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { funnel } from "@/lib/track-client";

/**
 * Botón principal que mide el clic (paso "cta_click" del embudo). Con
 * `keepUtm`, las UTM de la dirección actual siguen en el enlace (la página
 * puede ser estática y no leer la query en el servidor).
 */
export function FunnelLink({ href, from, keepUtm, className, children }: { href: string; from: string; keepUtm?: boolean; className?: string; children: React.ReactNode }) {
  const [target, setTarget] = useState(href);
  useEffect(() => {
    if (!keepUtm) return;
    const cur = new URLSearchParams(window.location.search);
    const [base, qs] = href.split("?");
    const q = new URLSearchParams(qs);
    for (const [k, v] of cur) if (/^(utm_[a-z]+|fbclid|gclid|ttclid)$/.test(k)) q.set(k, v.slice(0, 200));
    const s = q.toString();
    setTarget(s ? `${base}?${s}` : base);
  }, [href, keepUtm]);
  return (
    <Link href={target} className={className} onClick={() => funnel("cta_click", { from })}>
      {children}
    </Link>
  );
}
