import type { Tier } from "./types";

/**
 * MODELO DE COSTES
 *
 * Precios de proveedor verificados en septiembre de 2026 (fuentes en
 * docs/business-model.md). Cambian a menudo y bajan con volumen, así que todo
 * el cálculo vive aquí para poder re-tarifar en un solo sitio.
 *
 * Unidades: centavos de USD.
 */
export const PROVIDER_COST = {
  /** Imagen con identidad preservada. Rango observado 0,3–4,0 ¢/imagen. */
  imageCents: 4.0,
  /** Vídeo image-to-video, por segundo. Rango observado 5–40 ¢/s según modelo. */
  videoCentsPerSec: 10.0,
  /** Modelos premium (Kling Pro y similares), por segundo. */
  videoPremiumCentsPerSec: 22.4,
  /** TTS por 1.000 caracteres (modelos flash/turbo). */
  voiceCentsPer1kChars: 5.0,
  /** Guion vía LLM. Prácticamente ruido, pero se contabiliza. */
  scriptCents: 1.0,
  /** Almacenamiento + CDN + orquestación amortizados por vídeo. */
  infraCents: 5.0,
} as const;

/**
 * LOS DOS PRODUCTOS
 *
 * Dos, y nada más. Un catálogo de dos líneas se entiende de un vistazo; en
 * cuanto hay cuatro precios la gente se para a comparar en vez de comprar.
 *
 * El precio es plano por producto: la duración la elige el usuario y no cambia
 * lo que paga. Un vídeo de 30 s nos cuesta la mitad que uno de 60, así que el
 * margen solo mejora si eligen corto — no hace falta cobrarlo aparte.
 */
/**
 * Los números. La copia —nombre, descripción, viñetas— vive en el diccionario
 * porque cambia con el idioma; el precio no.
 */
export interface Product {
  id: Tier;
  priceUsd: number;
}

export const PRODUCTS: Record<Tier, Product> = {
  vision: { id: "vision", priceUsd: 9 },
  cinematic: { id: "cinematic", priceUsd: 39 },
};

export function productFor(tier: Tier): Product {
  return PRODUCTS[tier];
}

export function priceUsd(tier: Tier): number {
  return PRODUCTS[tier].priceUsd;
}

/** Cuántas escenas lleva cada combinación de producto y duración. */
export function sceneCount(tier: Tier, durationSec: 30 | 60): number {
  if (tier === "vision") return durationSec === 30 ? 6 : 12;
  return durationSec === 30 ? 6 : 10;
}

/** Coste de proveedor estimado, en centavos de USD, antes de generar. */
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

/** Margen bruto a precio de catálogo, 0–1. Para el panel interno. */
export function grossMargin(tier: Tier, durationSec: 30 | 60, premium = false): number {
  const revenueCents = priceUsd(tier) * 100;
  const costCents = estimateCostCents(tier, durationSec, premium);
  return (revenueCents - costCents) / revenueCents;
}

/**
 * EL MARKET
 *
 * Quien usa la plantilla de otro paga exactamente lo mismo que si empezara de
 * cero — $9 o $39 — y de ese pago se lleva un 30 % quien la creó.
 *
 * Sin tarifa de plantilla aparte. Dos cobros por una compra obligan a explicar
 * por qué son dos, y ninguna explicación mejora que no haya nada que explicar.
 */
export const CREATOR_SHARE = 0.3;

export function creatorPayoutUsd(tier: Tier): number {
  return Math.round(priceUsd(tier) * CREATOR_SHARE * 100) / 100;
}

/** Lo que se muestra en dólares, sin decimales cuando son redondos. */
export function formatUsd(amount: number): string {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

/**
 * PRIMER VÍDEO GRATIS
 *
 * El output es un vídeo vertical con la cara del usuario, que él mismo
 * comparte. Es el anuncio más barato que se puede comprar: cuesta ~0,58 $ y
 * se lo lleva puesto.
 */
export const FREE_VIDEOS = Number(process.env.FREE_VIDEOS ?? 1);

/**
 * Mientras no haya pasarela de pago, no se cobra: se enseña el precio y se
 * genera igual. Se activa poniendo PAYMENTS_ENABLED=true cuando entre Stripe.
 */
export const PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED === "true";
