import type { User } from "./types";

/** Versión del texto de consentimiento de fotos: si cambia, se vuelve a pedir. */
export const PHOTO_CONSENT_VERSION = "2026-10-31";

/** Ya dio el consentimiento expreso (versión actual) para usar fotos de su cara. */
export const hasPhotoConsent = (user: Pick<User, "photoConsent"> | undefined) =>
  user?.photoConsent?.version === PHOTO_CONSENT_VERSION;
