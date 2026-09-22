import type {
  ImageProvider,
  ScriptProvider,
  VideoProvider,
  VoiceProvider,
} from "./contracts";
import { mockImage, mockScript, mockVideo, mockVoice } from "./mock";
import { falImage, falVideo } from "./fal";
import { klingVideo } from "./kling";
import { elevenVoice } from "./elevenlabs";
import { anthropicScript, openaiScript, withFallback } from "./llm";

/**
 * Registro de proveedores.
 *
 * Cada etapa del pipeline se elige por variable de entorno y el valor por
 * defecto es `mock`, para que clonar el repo y hacer `npm run dev` de un
 * producto completo y gratis. Cambiar de proveedor es una linea del .env,
 * no un refactor.
 */

export type Stage = "script" | "image" | "video" | "voice";

const SCRIPT: Record<string, ScriptProvider> = {
  mock: mockScript,
  anthropic: withFallback(anthropicScript),
  openai: withFallback(openaiScript),
};

const IMAGE: Record<string, ImageProvider> = {
  mock: mockImage,
  fal: falImage,
};

const VIDEO: Record<string, VideoProvider> = {
  mock: mockVideo,
  fal: falVideo,
  kling: klingVideo,
};

const VOICE: Record<string, VoiceProvider> = {
  mock: mockVoice,
  elevenlabs: elevenVoice,
};

function pick<T>(table: Record<string, T>, envValue: string | undefined, stage: Stage): T {
  const key = (envValue ?? "mock").toLowerCase();
  const found = table[key];
  if (!found) {
    console.warn(`[ai] proveedor "${key}" desconocido para ${stage}; se usa mock`);
    return table.mock;
  }
  return found;
}

export const providers = {
  get script(): ScriptProvider {
    return pick(SCRIPT, process.env.SCRIPT_PROVIDER, "script");
  },
  get image(): ImageProvider {
    return pick(IMAGE, process.env.IMAGE_PROVIDER, "image");
  },
  get video(): VideoProvider {
    return pick(VIDEO, process.env.VIDEO_PROVIDER, "video");
  },
  get voice(): VoiceProvider {
    return pick(VOICE, process.env.VOICE_PROVIDER, "voice");
  },
};

/** True si todo el pipeline corre en mock: la UI lo avisa al usuario. */
export function isDemoMode(): boolean {
  return (
    providers.script.name.startsWith("mock") &&
    providers.image.name === "mock" &&
    providers.video.name === "mock" &&
    providers.voice.name === "mock"
  );
}

export type { ImageProvider, ScriptProvider, VideoProvider, VoiceProvider };
