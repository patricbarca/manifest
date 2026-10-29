import { createHash } from "node:crypto";
import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { providers } from "./ai";
import { DATA_DIR, localPathForMediaUrl, mediaPath, mediaUrl } from "./paths";
import type { Locale } from "./i18n/locale";

/**
 * Voces de las frases fijas (bienvenida, respiración, "repite conmigo", cierre)
 * son iguales para todos con el mismo idioma y voz: se graban una vez y se
 * reutilizan. Ahorra tiempo (~15 s por vídeo) y céntimos de voz.
 */
const FIXED = new Set(["welcome", "bin", "bout", "ram", "close", "seal"]);
const CACHE_DIR = path.join(DATA_DIR, "cache", "voice");

function cacheFile(locale: string, voice: string | undefined, text: string): string {
  const model = process.env.FAL_TTS_MODEL ?? "elevenlabs/tts/eleven-v4";
  const h = createHash("sha256").update(`${model}|${locale}|${voice ?? ""}|${text}`).digest("hex").slice(0, 32);
  return path.join(CACHE_DIR, `${h}.mp3`);
}

const exists = (p: string) => access(p).then(() => true, () => false);

export async function speakLinesCached(opts: {
  lines: Record<string, string>;
  projectId: string;
  locale: Locale;
  voice?: string;
}): Promise<{ result: Record<string, string>; costCents: number }> {
  const result: Record<string, string> = {};
  const toSpeak: Record<string, string> = {};
  for (const [k, text] of Object.entries(opts.lines)) {
    const cached = FIXED.has(k) ? cacheFile(opts.locale, opts.voice, text) : null;
    if (cached && (await exists(cached))) {
      await mkdir(mediaPath("generated", opts.projectId, "voz"), { recursive: true });
      await copyFile(cached, mediaPath("generated", opts.projectId, "voz", `${k}.mp3`));
      result[k] = mediaUrl("generated", opts.projectId, "voz", `${k}.mp3`);
    } else {
      toSpeak[k] = text;
    }
  }
  let costCents = 0;
  if (Object.keys(toSpeak).length) {
    const out = await providers.voice.speakLines!({ lines: toSpeak, projectId: opts.projectId, locale: opts.locale, voice: opts.voice });
    costCents = out.costCents;
    for (const [k, url] of Object.entries(out.result)) {
      result[k] = url;
      if (!FIXED.has(k)) continue;
      const src = localPathForMediaUrl(url);
      if (!src) continue;
      try {
        await mkdir(CACHE_DIR, { recursive: true });
        await copyFile(src, cacheFile(opts.locale, opts.voice, toSpeak[k]));
      } catch {
        /* sin caché no pasa nada: la próxima vez se graba de nuevo */
      }
    }
  }
  return { result, costCents };
}
