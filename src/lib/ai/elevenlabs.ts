import type { VoiceProvider } from "./contracts";
import { PROVIDER_COST } from "../pricing";
import { persistBuffer } from "./storage";
import type { VoiceTone } from "../types";

/**
 * ElevenLabs para la narracion.
 *
 * El tono no cambia de voz, cambia los ajustes: en una practica de
 * visualizacion importa mas el ritmo y la estabilidad que el timbre.
 */
const TONE_SETTINGS: Record<VoiceTone, { stability: number; similarity_boost: number; speed: number }> = {
  calma: { stability: 0.72, similarity_boost: 0.7, speed: 0.88 },
  firme: { stability: 0.5, similarity_boost: 0.8, speed: 1.0 },
  cercana: { stability: 0.6, similarity_boost: 0.85, speed: 0.95 },
};

export const elevenVoice: VoiceProvider = {
  name: "elevenlabs",
  async speak({ text, tone, projectId }) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("Falta ELEVENLABS_API_KEY. Pon VOICE_PROVIDER=mock.");

    const voiceId = process.env.ELEVENLABS_VOICE_ES ?? "EXAVITQu4vr4xnSDxMaL";
    const model = process.env.ELEVENLABS_MODEL ?? "eleven_flash_v2_5";

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: TONE_SETTINGS[tone],
        }),
      },
    );
    if (!res.ok) {
      throw new Error(`ElevenLabs respondió ${res.status}: ${await res.text()}`);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const url = await persistBuffer(buf, projectId, "voz.mp3");
    const costCents = +((text.length / 1000) * PROVIDER_COST.voiceCentsPer1kChars).toFixed(3);
    return { result: { url, mode: "file" as const }, costCents, provider: `elevenlabs:${model}` };
  },
};
