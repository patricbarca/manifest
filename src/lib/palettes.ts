import type { Palette } from "./types";

/** Muestra de cada paleta del fondo animado (los colores de render/build_glass.py). */
export const PALETTE_SWATCH: Record<Palette, string> = {
  dusk: "radial-gradient(circle at 30% 20%, #f6b296, transparent 60%), radial-gradient(circle at 70% 80%, #968adc, transparent 60%), #3a2a4a",
  ocean: "radial-gradient(circle at 30% 20%, #6ec8dc, transparent 60%), radial-gradient(circle at 70% 80%, #5a6ec8, transparent 60%), #15304a",
  sage: "radial-gradient(circle at 30% 20%, #dcd2aa, transparent 60%), radial-gradient(circle at 70% 80%, #82aa96, transparent 60%), #2a3a30",
  rose: "radial-gradient(circle at 30% 20%, #facdbe, transparent 60%), radial-gradient(circle at 70% 80%, #c87896, transparent 60%), #4a2434",
  lavender: "radial-gradient(circle at 30% 20%, #e6bef0, transparent 60%), radial-gradient(circle at 70% 80%, #8278d2, transparent 60%), #2c2650",
  gold: "radial-gradient(circle at 30% 20%, #fae1aa, transparent 60%), radial-gradient(circle at 70% 80%, #be8c50, transparent 60%), #3a2c16",
};
