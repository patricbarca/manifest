import { templatePreview } from "@/lib/templates";
import type { Template } from "@/lib/types";

/**
 * Vista previa de una plantilla, fiel a lo que se compra:
 * - "cinematic" (Animado): el clip de ejemplo, que se mueve de verdad.
 * - "vision" (Imágenes): una imagen fija con movimiento de cámara, que es
 *   exactamente lo que entrega ese producto. Enseñar un clip animado aquí
 *   sería vender algo que no incluye.
 * Sin preview, solo el degradado de portada.
 */
export function TemplateMedia({
  template,
  className = "",
}: {
  template: Pick<Template, "slug" | "tier" | "cover">;
  className?: string;
}) {
  const { video, poster } = templatePreview(template.slug);
  const background = `linear-gradient(150deg, ${template.cover.from}, ${template.cover.to})`;

  if (template.tier === "vision") {
    return (
      <div className={`overflow-hidden ${className}`} style={{ background }}>
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="kb-loop h-full w-full object-cover" />
        )}
      </div>
    );
  }

  return (
    <video
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
