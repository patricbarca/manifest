import type { LifeArea, ScriptDraft, Tier, VoiceTone } from "../types";

/**
 * Toda llamada a un proveedor devuelve tambien lo que costo, para poder
 * cerrar el margen por video sin tener que reconstruirlo desde la factura.
 */
export interface Billed<T> {
  result: T;
  costCents: number;
  provider: string;
}

export interface ScriptProvider {
  name: string;
  write(input: {
    area: LifeArea;
    intention: string;
    durationSec: 30 | 60;
    tier: Tier;
    tone: VoiceTone;
    seed: string;
  }): Promise<Billed<ScriptDraft>>;
}

export interface ImageProvider {
  name: string;
  generate(input: {
    prompt: string;
    /** Ruta absoluta en disco del selfie, si el usuario subio uno. */
    referencePath?: string;
    projectId: string;
    sceneId: string;
  }): Promise<Billed<{ url: string }>>;
}

export interface VideoProvider {
  name: string;
  animate(input: {
    imageUrl: string;
    prompt: string;
    durationSec: number;
    projectId: string;
    sceneId: string;
  }): Promise<Billed<{ url: string }>>;
}

export interface VoiceProvider {
  name: string;
  speak(input: {
    text: string;
    tone: VoiceTone;
    projectId: string;
  }): Promise<Billed<{ url?: string; mode: "file" | "browser" }>>;
}
