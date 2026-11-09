// Copia el motor de detección de caras (MediaPipe) a public/ para servirlo
// nosotros: sin CDN de terceros y siempre la misma versión que el paquete.
import { cpSync, mkdirSync, readdirSync } from "node:fs";

const from = "node_modules/@mediapipe/tasks-vision/wasm";
const to = "public/mediapipe";
mkdirSync(to, { recursive: true });
for (const f of readdirSync(from)) {
  if (/^vision_wasm_(nosimd_)?internal\.(js|wasm)$/.test(f)) cpSync(`${from}/${f}`, `${to}/${f}`);
}
