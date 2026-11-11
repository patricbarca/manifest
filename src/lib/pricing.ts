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
  /** Imagen con identidad preservada (Seedream 4.5 vía fal). */
  imageCents: Number(process.env.IMAGE_COST_CENTS ?? 4.0), // Seedream 4.5; si se cambia FAL_IMAGE_MODEL, ajustar
  /** Vídeo image-to-video, por segundo (MiniMax H3 Max vía fal). */
  videoCentsPerSec: 3.25,
  /** Modelos premium (Kling Pro y similares), por segundo. */
  videoPremiumCentsPerSec: 22.4,
  /**
   * Nivel Elevado: Kling 3.0 Pro vía fal, sin audio. 14 ¢/s según get_pricing
   * de fal el 24-oct-2026. No está confirmado si activar el audio lo encarece.
   */
  videoElevatedCentsPerSec: 14.0,
  /** TTS por 1.000 caracteres (ElevenLabs v4 vía fal). */
  voiceCentsPer1kChars: 8.0,
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

/**
 * Precio del primer vídeo por calidad. Se cambia sin tocar código con
 * TIER_PRICES="vision:9,cinematic:39,elevated:49" (solo en el servidor: los
 * componentes de cliente reciben los precios por props).
 */
/**
 * El vídeo completo son 3 deseos: cuesta lo mismo que el pack de 3 de su tipo
 * (Stills: 3 stills; Cinematic: 3 deseos; Elevated: 3 deseos × 2).
 */
function defaultTierPrices(): Record<Tier, number> {
  const three = (packs: CreditPack[], fallback: number) => packs.find((p) => p.qty === 3)?.priceUsd ?? fallback;
  const wish3 = three(creditPacks(), 25);
  return { vision: three(stillPacks(), 12), cinematic: wish3, elevated: three(elevatedPacks(), wish3 * 2) };
}

function tierPrices(): Record<Tier, number> {
  const out = defaultTierPrices();
  for (const part of (process.env.TIER_PRICES ?? "").split(",")) {
    const [k, v] = part.split(":").map((x) => x.trim());
    const n = Number(v);
    if (k in out && Number.isFinite(n) && n >= 1 && n <= 999) out[k as Tier] = n;
  }
  return out;
}

const PRICES = tierPrices();
export const PRODUCTS: Record<Tier, Product> = {
  vision: { id: "vision", priceUsd: PRICES.vision },
  cinematic: { id: "cinematic", priceUsd: PRICES.cinematic },
  elevated: { id: "elevated", priceUsd: PRICES.elevated },
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

  if (tier !== "vision") {
    const perSec =
      tier === "elevated"
        ? PROVIDER_COST.videoElevatedCentsPerSec
        : premium
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
 * cero — $9 o $29 — y de ese pago se lleva un 30 % quien la creó.
 *
 * Sin tarifa de plantilla aparte. Dos cobros por una compra obligan a explicar
 * por qué son dos, y ninguna explicación mejora que no haya nada que explicar.
 */
export const CREATOR_SHARE = 0.3;

export function creatorPayoutUsd(tier: Tier): number {
  return Math.round(priceUsd(tier) * CREATOR_SHARE * 100) / 100;
}

/** Lo que se muestra en dólares, sin decimales cuando son redondos. */
/** Precio en dólares estadounidenses, explícito ("US$39"): la tienda es australiana y cobra en USD. */
export function formatUsd(amount: number): string {
  return Number.isInteger(amount) ? `US$${amount}` : `US$${amount.toFixed(2)}`;
}

/**
 * VÍDEOS GRATIS
 *
 * Desactivado por defecto (decisión de producto, oct. 2026): todos los vídeos
 * se pagan. Con FREE_VIDEOS=1 vuelve el primer vídeo gratis con marca de agua,
 * y la web solo lo anuncia en el asistente y la biblioteca.
 */
export const FREE_VIDEOS = Number(process.env.FREE_VIDEOS ?? 0);

/**
 * Mientras no haya pasarela de pago, no se cobra: se enseña el precio y se
 * genera igual. Se activa poniendo PAYMENTS_ENABLED=true cuando entre Stripe.
 */
export const PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED === "true";

/**
 * PAQUETES DE MANIFESTACIONES (añadir deseos de uno en uno)
 *
 * Coste real por manifestación ~0,25–0,40 $ (imagen + animación + voz).
 * Precio por defecto: 1 → 7 $, 5 → 29 $, 12 → 59 $. Se cambian sin tocar
 * código con PACK_PRICES="1:9,5:35,12:69".
 */
export interface CreditPack {
  qty: number;
  priceUsd: number;
}

function parsePacks(raw: string, fallback: CreditPack): CreditPack[] {
  const packs = raw
    .split(",")
    .map((p) => p.split(":").map(Number))
    .filter(([q, price]) => q > 0 && price > 0)
    .map(([qty, priceUsd]) => ({ qty, priceUsd }));
  return packs.length ? packs : [fallback];
}

/** Packs de deseos animados (PACK_PRICES). Por defecto: 1 → 10 $, 3 → 25 $, 10 → 69 $. */
export function creditPacks(): CreditPack[] {
  return parsePacks(process.env.PACK_PRICES ?? "1:10,3:25,10:69", { qty: 1, priceUsd: 10 });
}

/** Packs de stills: fotos tuyas con movimiento de cámara (STILL_PACK_PRICES). Por defecto: 1 → 5 $, 3 → 12 $, 10 → 35 $. */
export function stillPacks(): CreditPack[] {
  return parsePacks(process.env.STILL_PACK_PRICES ?? "1:5,3:12,10:35", { qty: 1, priceUsd: 5 });
}

/**
 * Packs de escenas Elevadas (ELEVATED_PACK_PRICES). Cada escena son 2 deseos:
 * al comprar se suman qty × 2 deseos. Por defecto: 1 → 20 $, 3 → 50 $, 5 → 69 $.
 */
export function elevatedPacks(): CreditPack[] {
  return parsePacks(process.env.ELEVATED_PACK_PRICES ?? "1:20,3:50,5:69", { qty: 1, priceUsd: 20 });
}

export type PackKind = "wishes" | "stills" | "elevated";
/** El tipo de pack que paga cada tipo de vídeo. */
export const packKindOf = (tier: Tier): PackKind => (tier === "vision" ? "stills" : tier === "elevated" ? "elevated" : "wishes");

/**
 * Precio de un vídeo con n deseos: la combinación de packs más barata que
 * sume justo n (4 = pack de 3 + 1), y nunca más que un pack mayor (4 Elevado
 * cuesta lo del pack de 5). Pura: sirve en el cliente.
 */
export function videoPriceUsd(packs: CreditPack[], n: number): number {
  const best = [0];
  for (let k = 1; k <= n; k++) {
    best[k] = Math.min(...packs.filter((p) => p.qty <= k).map((p) => best[k - p.qty] + p.priceUsd), Infinity);
  }
  const bigger = Math.min(...packs.filter((p) => p.qty >= n).map((p) => p.priceUsd), Infinity);
  const price = Math.min(best[n], bigger);
  return Number.isFinite(price) ? +price.toFixed(2) : 0;
}
export const packsFor = (kind: PackKind) => (kind === "stills" ? stillPacks() : kind === "elevated" ? elevatedPacks() : creditPacks());

/** Cuánto saldo da un pack: deseos (Animado y Elevado, ×2) o fotos con movimiento. */
export function packGrant(kind: PackKind, qty: number): { field: "credits" | "stillCredits"; n: number } {
  if (kind === "stills") return { field: "stillCredits", n: qty };
  return { field: "credits", n: kind === "elevated" ? qty * 2 : qty };
}

/** "3 deseos · US$25": lo que gasta y cuesta un vídeo completo (3 escenas) de cada tipo. */
export function videoLabel(tier: Tier, many: { wishes: string; stills: string }): string {
  const units = tier === "vision" ? many.stills.replace("{n}", "3") : many.wishes.replace("{n}", tier === "elevated" ? "6" : "3");
  return `${units} · ${formatUsd(PRODUCTS[tier].priceUsd)}`;
}

/** "Completa tu vídeo": a quien compró 1 deseo, los 2 que le faltan al precio del pack de 3 (25 − 10 = 15 $). */
export function upsellPack(): CreditPack | undefined {
  const packs = creditPacks();
  const one = packs.find((p) => p.qty === 1)?.priceUsd;
  const three = packs.find((p) => p.qty === 3)?.priceUsd;
  return one && three && three > one ? { qty: 2, priceUsd: three - one } : undefined;
}

/** Precio suelto de una escena: 1 foto con movimiento (Stills), 1 deseo (Animado) o 2 deseos (Elevado). */
export function scenePrice(tier: Tier): number {
  const one = (packs: CreditPack[]) => packs.find((p) => p.qty === 1)?.priceUsd ?? packs[0].priceUsd;
  if (tier === "vision") return one(stillPacks());
  return one(creditPacks()) * (tier === "elevated" ? 2 : 1);
}
