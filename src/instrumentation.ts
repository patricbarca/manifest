/** Al arrancar el servidor: relanza los vídeos que quedaron a medias. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { resumeInterrupted } = await import("./lib/queue");
  // Un poco después de arrancar, para no competir con el primer arranque.
  setTimeout(() => {
    resumeInterrupted().catch((err) => console.error("[queue] al reanudar:", err));
  }, 5000);

  // Avisos a socios (recordatorio diario y revisión mensual), cada 20 minutos.
  const { remindersEnabled, runPracticeJobs } = await import("./lib/reminders");
  if (remindersEnabled()) {
    setInterval(() => {
      runPracticeJobs()
        .then((r) => (r.reminders || r.checkins) && console.log("[avisos]", r))
        .catch((err) => console.error("[avisos]", err));
    }, 20 * 60_000);
  }
}
