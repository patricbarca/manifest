/** Complexión y estatura que la persona elige con botones (opcional). */
export const BODY_BUILDS = ["slim", "average", "athletic", "curvy", "plus"] as const;
export const BODY_HEIGHTS = ["short", "average", "tall"] as const;
export type BodyBuild = (typeof BODY_BUILDS)[number];
export type BodyHeight = (typeof BODY_HEIGHTS)[number];
export interface BodyFeatures {
  build?: BodyBuild;
  height?: BodyHeight;
}

const BUILD_EN: Record<BodyBuild, string> = {
  slim: "slim, slender build",
  average: "average, medium build",
  athletic: "athletic, toned build",
  curvy: "curvy build",
  plus: "plus-size, full-figured build",
};
const HEIGHT_EN: Record<BodyHeight, string> = {
  short: "petite, short stature",
  average: "average height",
  tall: "tall stature",
};

/**
 * Frase para el prompt de imagen. En palabras, no en cm o kg: los modelos de
 * imagen no convierten números en proporciones. Vacía si no eligió nada.
 */
export function bodyClause(body?: BodyFeatures): string {
  const parts = [body?.build && BUILD_EN[body.build], body?.height && HEIGHT_EN[body.height]].filter(Boolean);
  return parts.length ? `Their real body: ${parts.join(", ")}, true to the reference photos` : "";
}
