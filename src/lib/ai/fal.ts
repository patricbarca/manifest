import type { ImageProvider, VideoProvider } from "./contracts";
import { PROVIDER_COST } from "../pricing";
import { fileToDataUri, persistRemoteAsset } from "./storage";
import { localPathForMediaUrl } from "../paths";

/**
 * fal.ai como pasarela unica para imagen y video.
 *
 * Es la eleccion por defecto para el MVP por una razon practica: una sola key
 * da acceso a flux-kontext (identidad preservada), nano-banana y a los modelos
 * de video de Kling/Wan/Veo, asi que se puede cambiar de modelo tocando una
 * variable de entorno en vez de escribir otro adaptador.
 */

const FAL_BASE = "https://fal.run";
const FAL_QUEUE = "https://queue.fal.run";

function key(): string {
  const k = process.env.FAL_KEY;
  if (!k) throw new Error("Falta FAL_KEY. Pon IMAGE_PROVIDER=mock o añade la key.");
  return k;
}

async function falCall(model: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${FAL_BASE}/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`fal ${model} respondió ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

/** Los modelos largos van por cola: se envia y se sondea hasta que termina. */
async function falQueue(
  model: string,
  body: unknown,
  { timeoutMs = 300_000 }: { timeoutMs?: number } = {},
): Promise<Record<string, unknown>> {
  const submit = await fetch(`${FAL_QUEUE}/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!submit.ok) {
    throw new Error(`fal queue ${model} respondió ${submit.status}: ${await submit.text()}`);
  }
  const { status_url, response_url } = (await submit.json()) as {
    status_url: string;
    response_url: string;
  };

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const st = await fetch(status_url, { headers: { Authorization: `Key ${key()}` } });
    const state = (await st.json()) as { status?: string };
    if (state.status === "COMPLETED") break;
    if (state.status === "FAILED") throw new Error(`fal ${model} falló en cola`);
  }

  const out = await fetch(response_url, { headers: { Authorization: `Key ${key()}` } });
  if (!out.ok) throw new Error(`fal ${model} sin resultado: ${out.status}`);
  return (await out.json()) as Record<string, unknown>;
}

function firstImageUrl(payload: Record<string, unknown>): string {
  const images = payload.images as { url?: string }[] | undefined;
  if (images?.[0]?.url) return images[0].url;
  const image = payload.image as { url?: string } | undefined;
  if (image?.url) return image.url;
  throw new Error("fal no devolvió ninguna imagen");
}

export const falImage: ImageProvider = {
  name: "fal",
  async generate({ prompt, referencePath, projectId, sceneId }) {
    const model = process.env.FAL_IMAGE_MODEL ?? "fal-ai/flux-pro/kontext";
    const body: Record<string, unknown> = {
      prompt,
      aspect_ratio: "9:16",
      num_images: 1,
      output_format: "jpeg",
      safety_tolerance: "2",
    };
    if (referencePath) body.image_url = await fileToDataUri(referencePath);

    const payload = await falCall(model, body);
    // Se copia a nuestro almacenamiento: las URLs de fal caducan.
    const url = await persistRemoteAsset(firstImageUrl(payload), projectId, `${sceneId}.jpg`);
    return { result: { url }, costCents: PROVIDER_COST.imageCents, provider: `fal:${model}` };
  },
};

export const falVideo: VideoProvider = {
  name: "fal",
  async animate({ imageUrl, prompt, durationSec, projectId, sceneId }) {
    const model =
      process.env.FAL_VIDEO_MODEL ?? "fal-ai/kling-video/v2/standard/image-to-video";
    // La imagen base se manda incrustada, no por URL: generar no puede
    // depender de que nuestra app sea alcanzable desde fuera.
    const local = localPathForMediaUrl(imageUrl);
    const image = local ? await fileToDataUri(local) : imageUrl;

    const payload = await falQueue(model, {
      prompt,
      image_url: image,
      duration: String(Math.min(10, Math.max(5, Math.round(durationSec)))),
      aspect_ratio: "9:16",
    });

    const video = payload.video as { url?: string } | undefined;
    if (!video?.url) throw new Error("fal no devolvió ningún video");
    const url = await persistRemoteAsset(video.url, projectId, `${sceneId}.mp4`);

    const premium = /pro|master|veo/.test(model);
    const perSec = premium
      ? PROVIDER_COST.videoPremiumCentsPerSec
      : PROVIDER_COST.videoCentsPerSec;
    return {
      result: { url },
      costCents: +(durationSec * perSec).toFixed(2),
      provider: `fal:${model}`,
    };
  },
};
