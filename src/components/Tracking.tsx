"use client";

import { useEffect, useState } from "react";
import type { TrackingConfig } from "@/lib/tracking";

type Labels = { text: string; accept: string; reject: string; more: string };
type Ev = { name: "begin_checkout" | "purchase"; value?: number; currency?: string; id?: string };

const KEYS = /^(utm_(source|medium|campaign|content|term)|gclid|gbraid|wbraid|ttclid|a)$/;
const YEAR_HALF = 60 * 60 * 24 * 180;

function readCookie(name: string): string | undefined {
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1);
}

function writeCookie(name: string, value: string, maxAge: number, domain?: string) {
  // En localhost o en la dirección de Railway el dominio común no vale: se guarda solo para este host.
  const d = domain && location.hostname.endsWith(domain.slice(1)) ? `; domain=${domain}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax; secure${d}`;
}

/** Origen del anuncio que trae la URL (utm_*, gclid, ttclid…). */
function urlAttribution(): Record<string, string> {
  const out: Record<string, string> = {};
  new URLSearchParams(location.search).forEach((v, k) => {
    if (KEYS.test(k) && v) out[k] = v.slice(0, 200);
  });
  return out;
}

function saveAttribution(cfg: TrackingConfig, fresh: Record<string, string>) {
  if (!Object.keys(fresh).length) return;
  let prev: Record<string, string> = {};
  try {
    prev = JSON.parse(decodeURIComponent(readCookie("ml_attr") ?? "")) ?? {};
  } catch {}
  // El último anuncio en el que hizo clic es el que cuenta.
  writeCookie("ml_attr", JSON.stringify({ ...prev, ...fresh, ts: String(Date.now()) }), 60 * 60 * 24 * 90, cfg.cookieDomain);
}

function loadScript(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; ttq?: { load: (id: string) => void; page: () => void; track: (n: string, d?: object, o?: object) => void } };

function startPixels(cfg: TrackingConfig) {
  const w = window as W;
  if (cfg.googleAdsId && !w.gtag) {
    w.dataLayer = w.dataLayer || [];
    // gtag necesita recibir el objeto `arguments`, no un array.
    w.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag("js", new Date());
    w.gtag("config", cfg.googleAdsId);
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${cfg.googleAdsId}`);
  }
  if (cfg.tiktokPixelId && !w.ttq) {
    // Código base oficial de TikTok (tal cual lo da TikTok), con el ID de la variable TIKTOK_PIXEL_ID.
    const s = document.createElement("script");
    s.text = `!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load(${JSON.stringify(cfg.tiktokPixelId)});
  ttq.page();
}(window, document, 'ttq');`;
    document.head.appendChild(s);
  }

  const send = (e: Ev) => {
    const currency = (e.currency ?? "usd").toUpperCase();
    if (cfg.googleAdsId && w.gtag) {
      const label = e.name === "purchase" ? cfg.googlePurchaseLabel : cfg.googleCheckoutLabel;
      if (label) w.gtag("event", "conversion", { send_to: `${cfg.googleAdsId}/${label}`, value: e.value, currency, transaction_id: e.id });
      else w.gtag("event", e.name, { value: e.value, currency, transaction_id: e.id });
    }
    if (cfg.tiktokPixelId && w.ttq) {
      w.ttq.track(e.name === "purchase" ? "CompletePayment" : "InitiateCheckout", { value: e.value, currency, content_type: "product", content_id: "manifestlifeai" }, e.id ? { event_id: e.id } : undefined);
    }
  };
  for (const e of window.__mlQueue ?? []) send(e);
  window.__mlQueue = [];
  window.__mlTrack = send;
}

/**
 * Banner de cookies de publicidad + píxeles de Google Ads y TikTok.
 * Sin aceptar no se carga nada de terceros ni se guarda el origen del anuncio.
 */
export function Tracking({ cfg, t, privacyHref }: { cfg: TrackingConfig; t: Labels; privacyHref: string }) {
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    const consent = readCookie("ml_consent");
    const fresh = urlAttribution();
    if (consent === "granted") {
      saveAttribution(cfg, fresh);
      startPixels(cfg);
    } else if (consent === "denied") {
      window.__mlTrack = () => {};
      window.__mlQueue = [];
    } else {
      if (Object.keys(fresh).length) sessionStorage.setItem("ml_attr_pending", JSON.stringify(fresh));
      setAsk(true);
    }
  }, [cfg]);

  function choose(granted: boolean) {
    writeCookie("ml_consent", granted ? "granted" : "denied", YEAR_HALF, cfg.cookieDomain);
    setAsk(false);
    if (granted) {
      try {
        saveAttribution(cfg, JSON.parse(sessionStorage.getItem("ml_attr_pending") ?? "{}"));
      } catch {}
      startPixels(cfg);
    } else {
      window.__mlTrack = () => {};
      window.__mlQueue = [];
    }
    sessionStorage.removeItem("ml_attr_pending");
  }

  if (!ask) return null;
  return (
    <div role="dialog" aria-live="polite" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-lg rounded-[var(--radius-md)] border border-[var(--color-hairline-strong)] bg-[#141018]/95 p-4 shadow-2xl backdrop-blur sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
      <p className="t-caption text-[var(--color-label-2)]">
        {t.text}{" "}
        <a href={privacyHref} className="underline">{t.more}</a>
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => choose(true)} className="interactive t-sub flex-1 rounded-full bg-white px-4 py-2 font-medium text-black">{t.accept}</button>
        <button type="button" onClick={() => choose(false)} className="interactive t-sub flex-1 rounded-full bg-white/10 px-4 py-2 font-medium">{t.reject}</button>
      </div>
    </div>
  );
}

/** Dispara la compra una sola vez por pedido (al volver de Stripe). */
export function TrackPurchase({ id, value, currency }: { id: string; value: number; currency?: string }) {
  useEffect(() => {
    const key = `ml_purchase_${id}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}
    const e: Ev = { name: "purchase", id, value, currency };
    if (window.__mlTrack) window.__mlTrack(e);
    else (window.__mlQueue ??= []).push(e);
  }, [id, value, currency]);
  return null;
}

/** Enlace del pie para volver a elegir: borra la elección y recarga (vuelve el aviso). */
export function CookieSettingsLink({ label, domain }: { label: string; domain?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        writeCookie("ml_consent", "", 0, domain);
        location.reload();
      }}
      className="t-caption text-[var(--color-label-3)] hover:text-[var(--color-label-1)]"
    >
      {label}
    </button>
  );
}
