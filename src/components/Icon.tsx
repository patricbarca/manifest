/**
 * Sistema de iconos.
 *
 * Antes esto eran caracteres de texto (◆ ❖ ▶ ❚❚ ∞ ♪ ⛶). Un glifo tipográfico
 * usado como icono nunca alinea igual que sus vecinos, cambia de forma según
 * la fuente instalada y no comparte grosor de trazo con nada: es el detalle
 * que hace que una interfaz parezca sin acabar, por encima de la paleta.
 *
 * Reglas: lienzo de 24, trazo de 1.6 con extremos redondos, mismo peso óptico
 * en todos, y `currentColor` siempre para que hereden del contexto.
 */

export type IconName =
  | "play"
  | "pause"
  | "restart"
  | "repeat"
  | "music"
  | "voice"
  | "expand"
  | "check"
  | "arrow-right"
  | "arrow-left"
  | "download"
  | "briefcase"
  | "growth"
  | "pulse"
  | "heart"
  | "person"
  | "compass";

type Props = {
  name: IconName;
  size?: number;
  className?: string;
  /** Los iconos decorativos se ocultan al lector de pantalla. */
  title?: string;
};

export function Icon({ name, size = 20, className, title }: Props) {
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {name === "play" && <path d="M8 5.2v13.6L19 12 8 5.2Z" fill="currentColor" />}
      {name === "pause" && (
        <>
          <rect x="7" y="5" width="3.4" height="14" rx="1.2" fill="currentColor" />
          <rect x="13.6" y="5" width="3.4" height="14" rx="1.2" fill="currentColor" />
        </>
      )}
      {name === "restart" && (
        <>
          <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" {...stroke} />
          <path d="M4 4.5V9h4.5" {...stroke} />
        </>
      )}
      {name === "repeat" && (
        <>
          <path d="M7 5h10a3.5 3.5 0 0 1 3.5 3.5V10" {...stroke} />
          <path d="M18.4 7.6 20.5 10l2.1-2.4" {...stroke} transform="translate(-2.1 0)" />
          <path d="M17 19H7a3.5 3.5 0 0 1-3.5-3.5V14" {...stroke} />
          <path d="M1.4 16.4 3.5 14l2.1 2.4" {...stroke} />
        </>
      )}
      {name === "music" && (
        <>
          <path d="M9 18V6.8l10-2v11" {...stroke} />
          <circle cx="6.8" cy="18" r="2.2" {...stroke} />
          <circle cx="16.8" cy="15.8" r="2.2" {...stroke} />
        </>
      )}
      {name === "voice" && (
        <>
          <path d="M4 11v2M8 8v8M12 5.5v13M16 8v8M20 11v2" {...stroke} />
        </>
      )}
      {name === "expand" && (
        <>
          <path d="M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5" {...stroke} />
        </>
      )}
      {name === "check" && <path d="m5 12.5 4.5 4.5L19 7.5" {...stroke} strokeWidth={2} />}
      {name === "arrow-right" && (
        <>
          <path d="M4.5 12h15M13.5 6l6 6-6 6" {...stroke} />
        </>
      )}
      {name === "arrow-left" && (
        <>
          <path d="M19.5 12h-15M10.5 6l-6 6 6 6" {...stroke} />
        </>
      )}
      {name === "download" && (
        <>
          <path d="M12 3.5v12M7.5 11l4.5 4.5 4.5-4.5" {...stroke} />
          <path d="M4.5 19.5h15" {...stroke} />
        </>
      )}
      {name === "briefcase" && (
        <>
          <rect x="3" y="7.5" width="18" height="12.5" rx="2.4" {...stroke} />
          <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" {...stroke} />
          <path d="M3 13h18" {...stroke} />
        </>
      )}
      {name === "growth" && (
        <>
          <path d="M4 18.5 9.5 13l3.5 3.5L20 9" {...stroke} />
          <path d="M15 9h5v5" {...stroke} />
        </>
      )}
      {name === "pulse" && (
        <path d="M3 12.5h4l2.5-6 4 12 2.5-6h5" {...stroke} />
      )}
      {name === "heart" && (
        <path
          d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5-7.5 9.6-7.5 9.6Z"
          {...stroke}
        />
      )}
      {name === "person" && (
        <>
          <circle cx="12" cy="8" r="3.6" {...stroke} />
          <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" {...stroke} />
        </>
      )}
      {name === "compass" && (
        <>
          <circle cx="12" cy="12" r="8.5" {...stroke} />
          <path d="m15 9-1.7 4.3L9 15l1.7-4.3L15 9Z" {...stroke} />
        </>
      )}
    </svg>
  );
}
