import { templatePreview } from "@/lib/templates";
import type { Template } from "@/lib/types";

/** Qué versión del ejemplo se enseña. */
export type PreviewVariant = "stills" | "animated" | "elevated";

/**
 * Vista previa de una plantilla, fiel a lo que se compra:
 * - "animated" (Animado): el clip de ejemplo, que se mueve de verdad.
 * - "stills" (Imágenes): un fotograma representativo con movimiento de
 *   cámara, que es exactamente lo que entrega ese producto.
 * - "elevated" (Elevado): el mismo ejemplo animado con Kling 3.0 Pro.
 * Sin preview, solo el degradado de portada.
 */
export function TemplateMedia({
  template,
  variant,
  className = "",
}: {
  template: Pick<Template, "slug" | "tier" | "cover">;
  /** Por defecto, la del producto de la plantilla. */
  variant?: PreviewVariant;
  className?: string;
}) {
  const { video: standard, poster, still, hd } = templatePreview(template.slug);
  const background = `linear-gradient(150deg, ${template.cover.from}, ${template.cover.to})`;
  const v = variant ?? (template.tier === "vision" ? "stills" : "animated");

  if (v === "stills") {
    const src = still ?? poster;
    return (
      <div className={`overflow-hidden ${className}`} style={{ background }}>
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="kb-loop h-full w-full object-cover" />
        )}
      </div>
    );
  }

  const video = v === "elevated" ? (hd ?? standard) : standard;
  return (
    <video
      key={video}
      src={video}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      className={`object-cover ${className}`}
      style={{ background }}
    />
  );
}
