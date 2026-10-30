import { isOutOfFunds, reportOutOfFunds } from "../provider-funds";
import type { Project } from "../types";
import { providers } from "../ai";
import { buildScenes, inferArea } from "../script-engine";
import { sceneLength } from "../experience";
import { localPathForMediaUrl } from "../paths";
import { mediaDuration } from "../render/glass";
import { makeHighlights } from "../highlights";
import { deleteMediaUrl, offloadProject } from "../cleanup";
import { manifests } from "./store";
import { ensureLocal } from "./compose";
import { db } from "../db/store";
import { bodyClause } from "../body";

/** Si la manifestación se pagó con un paquete y falló, devuelve la unidad (solo una vez). */
export async function refundCredit(id: string): Promise<void> {
  const m = await manifests.get(id);
  // Regeneración gratis que falló: se devuelve al contador.
  if (m?.freeRegen) await manifests.patch(id, (cur) => ({ ...cur, freeRegen: undefined, regensUsed: Math.max(0, (cur.regensUsed ?? 1) - 1) }));
  if (!m?.paidCredit) return;
  await manifests.patch(id, (cur) => ({ ...cur, paidCredit: undefined, editPaid: undefined }));
  const user = await db.getUser(m.ownerId);
  if (user) await db.putUser({ ...user, credits: (user.credits ?? 0) + 1 });
}

/**
 * Genera UNA manifestación: guion de un deseo → imagen con su cara → voz de
 * la afirmación → animación del largo de la frase → highlight. Coste típico
 * ~0,25–0,40 $ (imagen + 6–10 s de animación + unos céntimos de voz).
 */
export async function runManifestation(id: string): Promise<void> {
  const start = await manifests.get(id);
  if (!start) throw new Error("Manifestación no encontrada");
  await manifests.patch(id, (m) => ({ ...m, status: "generating", error: undefined }));
  let cents = 0;
  try {
    // Editar escena: la imagen ya está hecha y aprobada; solo falta animarla.
    const animateOnly = !!(start.animateOnly && start.draftImageUrl && (await ensureLocal(start.draftImageUrl)));
    // Nombre nuevo en cada versión: así el navegador no enseña la imagen anterior en caché.
    const sceneId = start.redoNote !== undefined || start.clipUrl ? `sc_${Date.now().toString(36)}` : "sc_1";
    let brief: string;
    let affirmation: string;
    let imageUrl: string;
    if (animateOnly) {
      brief = start.brief ?? start.desire;
      affirmation = start.affirmation ?? start.desire;
      imageUrl = start.draftImageUrl!;
    } else {
      // 1. Escena y frase para este deseo.
      const script = await providers.script.write({
        area: inferArea(start.desire),
        intention: start.desire,
        durationSec: 30,
        tier: "cinematic",
        tone: "calma",
        seed: id,
        locale: start.locale,
        desires: [start.desire],
        // Al rehacerla, el cambio que pidió manda sobre la versión anterior.
        details: start.redoNote ? [{ question: "Cambio que pidió para esta escena", answer: start.redoNote }] : undefined,
      });
      cents += script.costCents;
      brief = script.result.sceneBriefs[0] ?? start.desire;
      affirmation = script.result.affirmations[0] ?? start.desire;
      const photos = (start.photoUrls ?? []).map((u) => localPathForMediaUrl(u)).filter((p): p is string => !!p);
      const owner = await db.getUser(start.ownerId);
      const [scene] = buildScenes([brief], start.style ?? "cinematic", photos.length > 0, 8, photos.length, bodyClause(owner?.body));

      // 2. Imagen con su cara.
      const prompt = start.redoNote ? `${scene.prompt}. Change requested by the person (apply it exactly): ${start.redoNote}` : scene.prompt;
      const image = await providers.image.generate({ prompt, referencePaths: photos.length ? photos : undefined, projectId: id, sceneId });
      cents += image.costCents;
      imageUrl = image.result.url;
    }

    // 3. Voz de la afirmación: marca cuánto dura la escena. Al solo re-animar, se reutiliza.
    let voiceUrl = animateOnly && start.voiceUrl && (await ensureLocal(start.voiceUrl)) ? start.voiceUrl : undefined;
    if (!voiceUrl) {
      if (!providers.voice.speakLines) throw new Error("La voz por frases no está disponible");
      const voice = await providers.voice.speakLines({ lines: { a0: affirmation }, projectId: id, locale: start.locale, voice: start.voice });
      cents += voice.costCents;
      voiceUrl = voice.result.a0;
    }
    const voiceAbs = voiceUrl ? localPathForMediaUrl(voiceUrl) : null;
    const secs = voiceAbs ? sceneLength(await mediaDuration(voiceAbs)) : 8;

    // 4. Movimiento.
    const plain = brief.replace(/^pov:\s*/i, "").replace(/\[\[\s*([^\]]+?)\s*\]\]/g, "a loved one");
    const clip = await providers.video.animate({
      imageUrl,
      prompt: `Gentle, realistic natural motion in this scene: ${plain}. Subtle movement of hair, clothes and light, people move naturally, the person keeps their face visible and turned toward the camera the whole time, steady camera, every face stays the same.`,
      durationSec: secs,
      projectId: id,
      sceneId,
      quality: start.quality ?? "standard",
    });
    cents += clip.costCents;

    // 5. Highlight para el perfil.
    const hl = await makeHighlights({ id, scenes: [{ videoUrl: clip.result.url }] } as unknown as Project).catch(() => undefined);

    await manifests.patch(id, (m) => ({
      ...m,
      status: "ready",
      brief,
      affirmation,
      imageUrl,
      voiceUrl,
      clipUrl: clip.result.url,
      highlight: hl?.[0],
      animateOnly: undefined,
      draftImageUrl: undefined,
      draftNote: undefined,
      draftTries: undefined,
      freeRegen: undefined,
      editPaid: undefined,
      costCents: +((start.costCents ?? 0) + cents).toFixed(2),
    }));
    // Al rehacerla, la versión anterior ya no se ve en ningún sitio: se borran sus ficheros.
    if (start.clipUrl) {
      const now = new Set([imageUrl, clip.result.url, voiceUrl, hl?.[0]?.videoUrl, hl?.[0]?.posterUrl]);
      for (const url of [start.imageUrl, start.draftImageUrl, start.clipUrl, start.voiceUrl, start.highlight?.videoUrl, start.highlight?.posterUrl]) {
        if (url && !now.has(url)) await deleteMediaUrl(url);
      }
    }
    await offloadProject(id);
  } catch (err) {
    // Proveedor sin saldo: se queda en cola (sin devolver nada: se hará igual) y se reintenta sola.
    if (isOutOfFunds(err)) {
      await manifests.patch(id, (m) => ({ ...m, status: "queued", waitingFunds: true, error: undefined, costCents: +((start.costCents ?? 0) + cents).toFixed(2) }));
      await reportOutOfFunds(id, err);
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    // Si falla al rehacerla, se queda la versión anterior tal cual (y se devuelve el crédito).
    if (start.clipUrl) {
      // Al editar, la imagen nueva se queda como borrador para volver a intentarlo.
      await manifests.patch(id, (m) => ({ ...m, status: "ready", error: undefined, animateOnly: undefined, costCents: +((start.costCents ?? 0) + cents).toFixed(2) }));
      await refundCredit(id);
      throw err;
    }
    await manifests.patch(id, (m) => ({ ...m, status: "failed", error: message, costCents: +cents.toFixed(2) }));
    await refundCredit(id);
    throw err;
  }
}
