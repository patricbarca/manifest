/** Aura de los círculos de highlights: color y movimiento que elige cada persona. */
export const AURA_COLORS = ["sunset", "gold", "rose", "violet", "emerald", "sky", "silver", "rainbow"] as const;
export const AURA_MOTIONS = ["breathe", "spin", "still"] as const;
export type AuraColor = (typeof AURA_COLORS)[number];
export type AuraMotion = (typeof AURA_MOTIONS)[number];
export interface AuraStyle {
  color: AuraColor;
  motion: AuraMotion;
}

/** Sin elegir: el degradado de siempre, respirando. */
export const DEFAULT_AURA: AuraStyle = { color: "sunset", motion: "breathe" };

/** Tres tonos del anillo y el color del halo. */
export const AURA_PALETTE: Record<AuraColor, { stops: string[]; glow: string }> = {
  sunset: { stops: ["#fcd34d", "#fb7185", "#d946ef"], glow: "rgba(251, 113, 133, 0.55)" },
  gold: { stops: ["#fff4c2", "#f5c542", "#b8860b"], glow: "rgba(245, 197, 66, 0.65)" },
  rose: { stops: ["#fecdd3", "#fb7185", "#e11d48"], glow: "rgba(244, 63, 94, 0.5)" },
  violet: { stops: ["#ddd6fe", "#a78bfa", "#7c3aed"], glow: "rgba(139, 92, 246, 0.55)" },
  emerald: { stops: ["#a7f3d0", "#34d399", "#059669"], glow: "rgba(16, 185, 129, 0.5)" },
  sky: { stops: ["#bae6fd", "#38bdf8", "#0284c7"], glow: "rgba(56, 189, 248, 0.55)" },
  silver: { stops: ["#ffffff", "#cbd5e1", "#64748b"], glow: "rgba(203, 213, 225, 0.6)" },
  rainbow: { stops: ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#c084fc"], glow: "rgba(192, 132, 252, 0.5)" },
};

export function parseAura(v: unknown): AuraStyle {
  const o = (v ?? {}) as Partial<AuraStyle>;
  return {
    color: (AURA_COLORS as readonly string[]).includes(o.color ?? "") ? (o.color as AuraColor) : DEFAULT_AURA.color,
    motion: (AURA_MOTIONS as readonly string[]).includes(o.motion ?? "") ? (o.motion as AuraMotion) : DEFAULT_AURA.motion,
  };
}

/** Variables CSS que usa .aura-ring (globals.css). */
export function auraVars(style: AuraStyle): Record<string, string> {
  const { stops, glow } = AURA_PALETTE[style.color];
  // Anillo cerrado: el degradado vuelve al primer tono para que al girar no haya corte.
  return { "--aura-ring": `conic-gradient(from 0deg, ${[...stops, ...stops.slice(0, -1).reverse()].join(", ")})`, "--aura-glow": glow };
}
