import type { User } from "./types";

/** Versión del texto de consentimiento de fotos: si cambia, se vuelve a pedir. */
export const PHOTO_CONSENT_VERSION = "2026-10-31.2";

/** Ya dio el consentimiento expreso (versión actual) para usar fotos de su cara. */
/** Versión del texto del permiso para emails de novedades y ofertas. */
export const MARKETING_CONSENT_VERSION = "2026-11-12.1";

/** Aceptó (con la casilla, sin marcar por defecto) recibir emails de novedades y ofertas. */
export const hasMarketingConsent = (user: Pick<User, "marketing"> | undefined) => !!user?.marketing;

export const hasPhotoConsent = (user: Pick<User, "photoConsent"> | undefined) =>
  user?.photoConsent?.version === PHOTO_CONSENT_VERSION;
