/** Tema elegido en Ajustes. "system" sigue al del móvil/ordenador. */
export const THEMES = ["dark", "light", "system"] as const;
export type Theme = (typeof THEMES)[number];
export const THEME_COOKIE = "ml_theme";

export function parseTheme(v: string | undefined): Theme {
  return (THEMES as readonly string[]).includes(v ?? "") ? (v as Theme) : "dark";
}

/** Color de la barra del navegador para cada tema. */
export const THEME_COLOR = { dark: "#0a0a0b", light: "#f5f5f7" } as const;

/**
 * Se ejecuta antes de pintar: con "system" pone claro u oscuro según el
 * dispositivo (y lo sigue si cambia), sin parpadeo.
 */
export const THEME_SCRIPT = `(function(){try{var d=document.documentElement;if(d.dataset.themePref!=="system")return;var m=matchMedia("(prefers-color-scheme: light)");var s=function(){d.dataset.theme=m.matches?"light":"dark"};s();m.addEventListener("change",s)}catch(e){}})();`;
