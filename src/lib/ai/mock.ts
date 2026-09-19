import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  ImageProvider,
  ScriptProvider,
  VideoProvider,
  VoiceProvider,
} from "./contracts";
import { draftScript } from "../script-engine";
import { PROVIDER_COST } from "../pricing";

/**
 * Proveedores de mentira, pero de verdad utiles: con ellos el producto entero
 * se puede recorrer de punta a punta sin una sola API key y sin gastar nada.
 * Es lo que corre en `npm run dev` recien clonado, y lo que usamos para los
 * tests del pipeline.
 */

const PALETTES = [
  ["#1b1035", "#4c1d95", "#f59e0b"],
  ["#0b1220", "#1e3a8a", "#38bdf8"],
  ["#1a0b14", "#831843", "#fb7185"],
  ["#0f1a14", "#14532d", "#86efac"],
  ["#1a1206", "#78350f", "#fbbf24"],
  ["#120b1f", "#5b21b6", "#c4b5fd"],
];

function svgScene(seedIndex: number, label: string): string {
  const p = PALETTES[seedIndex % PALETTES.length];
  const angle = (seedIndex * 37) % 360;
  const safe = label.replace(/[<>&]/g, "").slice(0, 46);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle} 0.5 0.5)">
      <stop offset="0%" stop-color="${p[0]}"/>
      <stop offset="55%" stop-color="${p[1]}"/>
      <stop offset="100%" stop-color="${p[2]}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="32%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vig" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.65"/>
    </radialGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/>
      <feColorMatrix type="saturate" values="0"/></filter>
  </defs>
  <rect width="720" height="1280" fill="url(#g)"/>
  <rect width="720" height="1280" fill="url(#glow)"/>
  <ellipse cx="360" cy="470" rx="150" ry="180" fill="#000" opacity="0.28"/>
  <path d="M170 1280 C 230 900, 490 900, 550 1280 Z" fill="#000" opacity="0.32"/>
  <rect width="720" height="1280" fill="url(#vig)"/>
  <rect width="720" height="1280" filter="url(#grain)" opacity="0.07"/>
  <text x="360" y="1216" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif"
        font-size="19" fill="#ffffff" opacity="0.5">${safe}</text>
  <text x="360" y="1246" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif"
        font-size="14" fill="#ffffff" opacity="0.3">vista previa · modo demo</text>
</svg>`;
}

async function writePublic(rel: string, contents: string): Promise<string> {
  const abs = path.join(process.cwd(), "public", rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, contents, "utf8");
  return "/" + rel.split(path.sep).join("/");
}

export const mockScript: ScriptProvider = {
  name: "mock",
  async write(input) {
    return {
      result: draftScript(input),
      costCents: 0,
      provider: "mock",
    };
  },
};

export const mockImage: ImageProvider = {
  name: "mock",
  async generate({ prompt, projectId, sceneId }) {
    const index = Number(sceneId.replace(/\D/g, "")) || 1;
    // Primeras palabras del brief, que es lo legible del prompt.
    const label = prompt.split(",").slice(1, 3).join(",").trim();
    const url = await writePublic(
      path.join("generated", projectId, `${sceneId}.svg`),
      svgScene(index, label),
    );
    // Latencia fingida para que la UI de progreso se pueda ver de verdad.
    await new Promise((r) => setTimeout(r, 120));
    return { result: { url }, costCents: 0, provider: "mock" };
  },
};

export const mockVideo: VideoProvider = {
  name: "mock",
  async animate({ imageUrl }) {
    // En demo no se anima nada: el reproductor aplica un Ken Burns sobre la
    // imagen. El tier cine se ve igual de fluido, pero sin coste.
    await new Promise((r) => setTimeout(r, 200));
    return { result: { url: imageUrl }, costCents: 0, provider: "mock" };
  },
};

export const mockVoice: VoiceProvider = {
  name: "mock",
  async speak() {
    // Sin fichero: el reproductor usa speechSynthesis del navegador. Suena
    // peor que ElevenLabs, pero la practica de repetir en voz alta funciona.
    return { result: { mode: "browser" as const }, costCents: 0, provider: "mock" };
  },
};

export const MOCK_REFERENCE_COST = PROVIDER_COST;
