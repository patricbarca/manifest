import { readFile } from "node:fs/promises";
import path from "node:path";
import { createFalClient, type FalClient } from "@fal-ai/client";
import type { ImageProvider, VideoProvider, VoiceProvider } from "./contracts";
import { PROVIDER_COST } from "../pricing";
import { persistBuffer, persistRemoteAsset } from "./storage";
import { localPathForMediaUrl } from "../paths";

/**
 * fal.ai como pasarela única: imagen, animación, voz y LLM con una sola key.
 *
 * Modelos por defecto (elegidos en las pruebas de octubre de 2026):
 *  - Imagen: Seedream 4.5 edit. Recibe hasta 10 fotos de referencia y es el
 *    que mejor conservó la cara del usuario. 4 ¢/imagen.
 *  - Animación: MiniMax H3 Max. Clips de hasta 15 s, 3,25 ¢/s.
 *  - Voz: ElevenLabs v4, voz "Sarah", con tono suave. 8 ¢ / 1.000 caracteres.
 *  - Guion: el router de OpenRouter dentro de fal.
 * Cada modelo se puede cambiar con su variable de entorno.
 */

let client: FalClient | undefined;

function fal(): FalClient {
  const credentials = process.env.FAL_KEY;
  if (!credentials) throw new Error("Falta FAL_KEY. Añádela en las variables del servicio.");
  client ??= createFalClient({ credentials });
  return client;
}

async function run<T>(endpoint: string, input: Record<string, unknown>): Promise<T> {
  const res = await fal().subscribe(endpoint, { input, logs: false });
  return res.data as T;
}

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp3": "audio/mpeg",
};

/**
 * Sube un fichero local al almacenamiento de fal y devuelve su URL.
 *
 * Así el modelo no depende de que nuestra app sea alcanzable desde fuera, y
 * no mandamos fotos de varios MB incrustadas en base64. Se cachea por ruta
 * mientras dure el proceso: las 6 escenas reutilizan las mismas fotos.
 */
const uploads = new Map<string, Promise<string>>();

export function falUpload(absPath: string): Promise<string> {
  let p = uploads.get(absPath);
  if (!p) {
    p = (async () => {
      const buf = await readFile(absPath);
      const type = MIME[path.extname(absPath).toLowerCase()] ?? "application/octet-stream";
      return fal().storage.upload(new Blob([new Uint8Array(buf)], { type }));
    })();
    uploads.set(absPath, p);
    p.catch(() => uploads.delete(absPath));
  }
  return p;
}

/** Tamaño vertical que acepta Seedream (entre 3,7 y 16,7 Mpx). */
const IMAGE_SIZE = { width: 1728, height: 3072 };

export const falImage: ImageProvider = {
  name: "fal",
  async generate({ prompt, referencePath, referencePaths, projectId, sceneId }) {
    const refs = referencePaths?.length ? referencePaths : referencePath ? [referencePath] : [];
    let model: string;
    let input: Record<string, unknown>;
    if (refs.length) {
      model = process.env.FAL_IMAGE_MODEL ?? "fal-ai/bytedance/seedream/v4.5/edit";
      const urls = await Promise.all(refs.slice(0, 10).map(falUpload));
      input = { prompt, image_urls: urls, image_size: IMAGE_SIZE, num_images: 1 };
    } else {
      model = process.env.FAL_IMAGE_T2I_MODEL ?? "fal-ai/bytedance/seedream/v4.5/text-to-image";
      input = { prompt, image_size: IMAGE_SIZE, num_images: 1 };
    }
    const data = await run<{ images?: { url?: string }[] }>(model, input);
    const remote = data.images?.[0]?.url;
    if (!remote) throw new Error("fal no devolvió ninguna imagen");
    // Se copia a nuestro almacenamiento: las URLs de fal caducan.
    const url = await persistRemoteAsset(remote, projectId, `${sceneId}.jpg`);
    return { result: { url }, costCents: PROVIDER_COST.imageCents, provider: `fal:${model}` };
  },
};

export const falVideo: VideoProvider = {
  name: "fal",
  async animate({ imageUrl, prompt, durationSec, projectId, sceneId, quality }) {
    const elevated = quality === "elevated";
    const model = elevated
      ? (process.env.FAL_VIDEO_MODEL_ELEVATED ?? "fal-ai/kling-video/v3/pro/image-to-video")
      : (process.env.FAL_VIDEO_MODEL ?? "minimax/h3-max/image-to-video");
    const local = localPathForMediaUrl(imageUrl);
    const image = local ? await falUpload(local) : imageUrl;
    let seconds = Math.min(15, Math.max(2, Math.ceil(durationSec * 2) / 2));

    // Cada familia pide la duración y la imagen de forma distinta.
    let input: Record<string, unknown>;
    if (/kling-video\/(v3|o3)/.test(model)) {
      // Kling 3: segundos enteros de 3 a 15, la imagen marca el formato.
      seconds = Math.min(15, Math.max(3, Math.ceil(seconds)));
      input = { prompt, start_image_url: image, duration: String(seconds), generate_audio: false };
    } else if (/kling/.test(model)) {
      seconds = seconds > 7 ? 10 : 5;
      input = { prompt, image_url: image, duration: String(seconds), aspect_ratio: "9:16" };
    } else {
      input = {
        prompt,
        image_url: image,
        duration: seconds,
        resolution: "768P",
        prompt_expansion_mode: "disabled",
      };
    }

    const data = await run<{ video?: { url?: string } }>(model, input);
    if (!data.video?.url) throw new Error("fal no devolvió ningún vídeo");
    const url = await persistRemoteAsset(data.video.url, projectId, `${sceneId}.mp4`);
    return {
      result: { url },
      costCents: +(
        seconds * (elevated ? PROVIDER_COST.videoElevatedCentsPerSec : PROVIDER_COST.videoCentsPerSec)
      ).toFixed(2),
      provider: `fal:${model}`,
    };
  },
};

/** Voz de una frase con ElevenLabs vía fal. Devuelve el MP3 y su coste. */
export async function falSpeech(
  text: string,
  locale: string,
  voice?: string,
): Promise<{ audio: Buffer; costCents: number }> {
  const model = process.env.FAL_TTS_MODEL ?? "elevenlabs/tts/eleven-v4";
  const data = await run<{ audio?: { url?: string } }>(model, {
    // Las etiquetas entre corchetes marcan el tono en Eleven v4.
    text: `[softly, calm and warm] ${text}`,
    voice: voice ?? process.env.FAL_TTS_VOICE ?? "Sarah",
    stability: 0.6,
    language_code: locale,
  });
  if (!data.audio?.url) throw new Error("fal no devolvió audio");
  const res = await fetch(data.audio.url);
  if (!res.ok) throw new Error(`No se pudo descargar el audio: ${res.status}`);
  return {
    audio: Buffer.from(await res.arrayBuffer()),
    costCents: +((text.length / 1000) * PROVIDER_COST.voiceCentsPer1kChars).toFixed(3),
  };
}

export const falVoice: VoiceProvider = {
  name: "fal",
  async speak({ text, projectId, locale, voice }) {
    const { audio, costCents } = await falSpeech(text, locale ?? "es", voice);
    const url = await persistBuffer(audio, projectId, "voz.mp3");
    return { result: { url, mode: "file" as const }, costCents, provider: "fal:elevenlabs" };
  },
  async speakLines({ lines, projectId, locale, voice }) {
    const urls: Record<string, string> = {};
    let costCents = 0;
    // De dos en dos: son frases cortas y así no se pisa el límite de la cuenta.
    const keys = Object.keys(lines);
    for (let i = 0; i < keys.length; i += 2) {
      await Promise.all(
        keys.slice(i, i + 2).map(async (k) => {
          const out = await falSpeech(lines[k], locale, voice);
          urls[k] = await persistBuffer(out.audio, projectId, `voz/${k}.mp3`);
          costCents += out.costCents;
        }),
      );
    }
    return { result: urls, costCents: +costCents.toFixed(3), provider: "fal:elevenlabs" };
  },
};

/** Texto con un LLM a través de fal (OpenRouter). */
export async function falText(system: string, user: string, maxTokens: number): Promise<string> {
  const data = await run<{ output?: string; error?: string | null }>("openrouter/router", {
    model: process.env.FAL_LLM_MODEL ?? "anthropic/claude-sonnet-4.6",
    system_prompt: system,
    prompt: user,
    max_tokens: maxTokens,
    temperature: 0.8,
  });
  if (data.error) throw new Error(`LLM vía fal: ${data.error}`);
  if (!data.output) throw new Error("LLM vía fal sin respuesta");
  return data.output;
}
