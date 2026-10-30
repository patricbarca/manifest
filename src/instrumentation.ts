/** Al arrancar el servidor: relanza los vídeos que quedaron a medias. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { resumeInterrupted } = await import("./lib/queue");
  const { importLegacyJson } = await import("./lib/db/legacy-import");
  importLegacyJson().catch((err) => console.error("[legacy] al importar:", err));
  // Un poco después de arrancar, para no competir con el primer arranque.
  setTimeout(() => {
    resumeInterrupted().catch((err) => console.error("[queue] al reanudar:", err));
    import("./lib/queue").then((q) => q.retryWaitingFunds()).catch((err) => console.error("[fondos] reintento:", err));
    import("./lib/queue").then((q) => q.resumeManifestations()).catch((err) => console.error("[queue] manifestaciones:", err));
  }, 5000);
  // Copias ligeras para el visor de las manifestaciones antiguas (una vez, en segundo plano).
  setTimeout(() => {
    import("./lib/playback").then((p) => p.backfillPlayCopies()).catch((err) => console.error("[playback] al rellenar:", err));
  }, 60 * 1000);
  // Recordatorio diario de racha: se mira cada 15 min (manda a las 19:00 locales, uno al día).
  const { runReminders } = await import("./lib/reminders");
  setInterval(() => {
    runReminders().catch((err) => console.error("[reminders]", err));
    import("./lib/queue").then((q) => q.approveStaleReviews()).catch((err) => console.error("[queue] revisiones:", err));
    import("./lib/queue").then((q) => q.retryWaitingFunds()).catch((err) => console.error("[fondos] reintento:", err));
  }, 15 * 60 * 1000);
}
