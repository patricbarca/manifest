/** Al arrancar el servidor: relanza los vídeos que quedaron a medias. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { resumeInterrupted } = await import("./lib/queue");
  const { importLegacyJson } = await import("./lib/db/legacy-import");
  importLegacyJson().catch((err) => console.error("[legacy] al importar:", err));
  // Un poco después de arrancar, para no competir con el primer arranque.
  setTimeout(() => {
    resumeInterrupted().catch((err) => console.error("[queue] al reanudar:", err));
  }, 5000);
}
