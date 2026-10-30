import type { CSSProperties, ReactNode } from "react";
import { auraVars, type AuraStyle } from "@/lib/social/aura-style";

/** Anillo de aura alrededor de un círculo (highlight o vista previa). */
export function AuraRing({ style, children, className = "" }: { style: AuraStyle; children: ReactNode; className?: string }) {
  const motion = style.motion === "breathe" ? "aura-breathe" : style.motion === "spin" ? "aura-spin" : "";
  return (
    <span className={`aura-ring ${motion} ${className}`} style={auraVars(style) as CSSProperties}>
      {children}
    </span>
  );
}
