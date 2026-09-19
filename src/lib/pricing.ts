import type { PlanId, Tier } from "./types";

/**
 * MODELO DE COSTES
 *
 * Precios de proveedor verificados en septiembre de 2026 (ver docs/business-model.md
 * para las fuentes). Son rangos publicos de lista: cambian a menudo y bajan con
 * volumen, asi que todo el calculo vive aqui para poder re-tarifar en un sitio.
 *
 * Unidades: centimos de USD.
 */
export const PROVIDER_COST = {
  /** Imagen con identidad preservada. Rango observado 0.3–4.0 c/imagen. */
  imageCents: 4.0,
  /** Video image-to-video, por segundo. Rango observado 5–40 c/s segun modelo. */
  videoCentsPerSec: 10.0,
  /** Video premium (Kling Pro y similares) por segundo. */
  videoPremiumCentsPerSec: 22.4,
  /** TTS por 1.000 caracteres (modelos flash/turbo). */
  voiceCentsPer1kChars: 5.0,
  /** Guion via LLM. Practicamente ruido, pero se contabiliza. */
  scriptCents: 1.0,
  /** Almacenamiento + CDN + orquestacion amortizados por video. */
  infraCents: 5.0,
} as const;

/** Cuantas escenas lleva cada combinacion de tier y duracion. */
export function sceneCount(tier: Tier, durationSec: 30 | 60): number {
  if (tier === "vision") return durationSec === 30 ? 6 : 12;
  return durationSec === 30 ? 6 : 10;
}

/** Estimacion de coste de proveedor, en centimos de USD, antes de generar. */
export function estimateCostCents(tier: Tier, durationSec: 30 | 60, premium = false): number {
  const scenes = sceneCount(tier, durationSec);
  const chars = durationSec === 30 ? 420 : 780;

  let cents = PROVIDER_COST.scriptCents + PROVIDER_COST.infraCents;
  cents += scenes * PROVIDER_COST.imageCents;
  cents += (chars / 1000) * PROVIDER_COST.voiceCentsPer1kChars;

  if (tier === "cinematic") {
    const perSec = premium
      ? PROVIDER_COST.videoPremiumCentsPerSec
      : PROVIDER_COST.videoCentsPerSec;
    cents += durationSec * perSec;
  }
  return Math.round(cents * 100) / 100;
}

/**
 * PRECIO AL USUARIO
 *
 * Todo se paga en creditos. 1 credito = 0,10 EUR de valor nominal, para que
 * el usuario pueda razonar sobre lo que gasta sin aprender una tabla nueva.
 */
export const CREDIT_EUR = 0.1;

export const CREDIT_COST: Record<string, number> = {
  "vision:30": 25,
  "vision:60": 40,
  "cinematic:30": 200,
  "cinematic:60": 380,
  /** Rehacer una escena suelta sin repetir todo el video. */
  "regen:image": 3,
  "regen:clip": 25,
  /** Cambiar la voz o el guion manteniendo las escenas. */
  "regen:voice": 4,
};

export function creditCost(tier: Tier, durationSec: 30 | 60): number {
  return CREDIT_COST[`${tier}:${durationSec}`] ?? 0;
}

export interface Plan {
  id: PlanId;
  name: string;
  priceEur: number;
  creditsPerMonth: number;
  tagline: string;
  perks: string[];
  highlight?: boolean;
  /** Los planes de pago quitan la marca de agua. */
  watermark: boolean;
  /** % que se lleva el creador al vender un blueprint en el market. */
  marketShare: number;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Prueba",
    priceEur: 0,
    creditsPerMonth: 30,
    tagline: "Un video de visión para ver si te resuena",
    perks: [
      "30 créditos una sola vez",
      "1 video Visión de 30 s",
      "Reproductor con afirmaciones sincronizadas",
      "Marca de agua",
    ],
    watermark: true,
    marketShare: 0,
  },
  {
    id: "semilla",
    name: "Semilla",
    priceEur: 9.99,
    creditsPerMonth: 120,
    tagline: "Para una práctica diaria con 3 videos al mes",
    perks: [
      "120 créditos al mes",
      "Hasta 3 videos Visión de 60 s",
      "Sin marca de agua",
      "Descarga MP4 y audio suelto",
      "Biblioteca personal",
    ],
    watermark: false,
    marketShare: 70,
  },
  {
    id: "creador",
    name: "Creador",
    priceEur: 24.99,
    creditsPerMonth: 350,
    tagline: "Mezcla visión y cine, y vende en el market",
    perks: [
      "350 créditos al mes",
      "1 video Cine de 30 s incluido",
      "Voz clonada propia",
      "Publica y vende blueprints (70% para ti)",
      "Rehacer escenas sueltas",
    ],
    highlight: true,
    watermark: false,
    marketShare: 70,
  },
  {
    id: "visionario",
    name: "Visionario",
    priceEur: 59.99,
    creditsPerMonth: 900,
    tagline: "Para coaches y quien lo usa con clientes",
    perks: [
      "900 créditos al mes",
      "2 videos Cine de 60 s incluidos",
      "Modelos de video premium",
      "Licencia comercial para clientes",
      "Marca propia en la portada",
      "80% de tus ventas en el market",
    ],
    watermark: false,
    marketShare: 80,
  },
];

/** Packs sueltos, para quien no quiere suscripcion. */
export const CREDIT_PACKS = [
  { credits: 60, priceEur: 8.99, label: "Pack pequeño" },
  { credits: 200, priceEur: 24.99, label: "Pack medio", best: true },
  { credits: 500, priceEur: 54.99, label: "Pack grande" },
];

export function planById(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

/** Margen bruto de un producto al precio de catalogo, 0–1. Para el panel interno. */
export function grossMargin(tier: Tier, durationSec: 30 | 60, premium = false): number {
  const revenueCents = creditCost(tier, durationSec) * CREDIT_EUR * 100;
  const costCents = estimateCostCents(tier, durationSec, premium);
  if (revenueCents === 0) return 0;
  return (revenueCents - costCents) / revenueCents;
}
