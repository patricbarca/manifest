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

/*
  Paletas desaturadas a proposito. Estas cajas ocupan el sitio de una
  fotografia, asi que tienen que comportarse como una: gama corta, luz que
  viene de un lado y nada de color de caramelo. Un degradado saturado delata
  al instante que ahi no hay una foto.
*/
const PALETTES = [
  ["#0b0d10", "#243040", "#8a9bb0"], // azul noche
  ["#0d0b0a", "#33261e", "#b89574"], // ambar tenue
  ["#0a0c0b", "#1f2e2a", "#7d9c90"], // verde salvia
  ["#0c0a0d", "#2b2333", "#9a8fae"], // malva frio
  ["#0d0c0a", "#36332b", "#b3ab94"], // arena
  ["#090b0d", "#1e2a33", "#7e98a8"], // acero
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
    <radialGradient id="glow" cx="72%" cy="22%" r="62%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
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
  <rect width="720" height="1280" fill="url(#vig)"/>
  <rect width="720" height="1280" filter="url(#grain)" opacity="0.11"/>
  <text x="360" y="62" text-anchor="middle" font-family="Inter,ui-sans-serif,system-ui,sans-serif"
        font-size="16" letter-spacing="-0.2" fill="#ffffff" opacity="0.38">${safe}</text>
  <text x="360" y="88" text-anchor="middle" font-family="Inter,ui-sans-serif,system-ui,sans-serif"
        font-size="11" letter-spacing="1.1" fill="#ffffff" opacity="0.22">VISTA PREVIA · MODO DEMO</text>
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
    // Solo la descripcion de la escena: el resto del prompt es estilo y
    // encuadre, que no dicen nada al mirar la vista previa.
    const brief = prompt.split(",")[1]?.trim() ?? "escena";
    const label = brief.charAt(0).toUpperCase() + brief.slice(1);
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
