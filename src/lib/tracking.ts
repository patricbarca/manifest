import { cookies } from "next/headers";
import { siteHost } from "./hosts";

/**
 * Medición de anuncios (Google Ads y TikTok). Todo se activa por variables y
 * solo carga si la persona acepta las cookies de publicidad:
 *  - GOOGLE_ADS_ID ("AW-123…"), GOOGLE_ADS_PURCHASE_LABEL, GOOGLE_ADS_CHECKOUT_LABEL
 *  - TIKTOK_PIXEL_ID
 * Se leen al servir la página (no en el build), así cambiarlas no exige recompilar.
 */
export interface TrackingConfig {
  googleAdsId?: string;
  googlePurchaseLabel?: string;
  googleCheckoutLabel?: string;
  tiktokPixelId?: string;
  /** ".manifestlife.ai": la elección de cookies y el origen del anuncio valen en la web y en la app. */
  cookieDomain?: string;
}

const clean = (v: string | undefined, re: RegExp) => (v && re.test(v.trim()) ? v.trim() : undefined);

export function trackingConfig(): TrackingConfig | null {
  const cfg: TrackingConfig = {
    googleAdsId: clean(process.env.GOOGLE_ADS_ID, /^AW-\d+$/),
    googlePurchaseLabel: clean(process.env.GOOGLE_ADS_PURCHASE_LABEL, /^[\w-]+$/),
    googleCheckoutLabel: clean(process.env.GOOGLE_ADS_CHECKOUT_LABEL, /^[\w-]+$/),
    tiktokPixelId: clean(process.env.TIKTOK_PIXEL_ID, /^[A-Z0-9]+$/i),
  };
  if (!cfg.googleAdsId && !cfg.tiktokPixelId) return null;
  const host = siteHost();
  if (host && host.includes(".") && !/^\d+\.\d+/.test(host)) cfg.cookieDomain = `.${host.replace(/^www\./, "")}`;
  return cfg;
}

/** Origen del anuncio guardado por el navegador (solo si aceptó): utm_*, gclid, ttclid… */
export type Attribution = Record<string, string>;
const KEYS = /^(utm_(source|medium|campaign|content|term)|gclid|gbraid|wbraid|ttclid|a)$/;

export async function readAttribution(): Promise<Attribution | undefined> {
  const raw = (await cookies()).get("ml_attr")?.value;
  if (!raw) return undefined;
  try {
    const obj = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    const out: Attribution = {};
    for (const [k, v] of Object.entries(obj)) if (KEYS.test(k) && typeof v === "string") out[k] = v.slice(0, 200);
    return Object.keys(out).length ? out : undefined;
  } catch {
    return undefined;
  }
}

/** Para Stripe: metadata[attr_utm_source]=… (máx. 500 caracteres por valor). */
export function attributionMetadata(a: Attribution | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(a ?? {})) out[`metadata[attr_${k}]`] = v;
  return out;
}
