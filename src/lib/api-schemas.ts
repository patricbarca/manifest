import { z } from "zod";

/**
 * Esquemas que comparten varias rutas. La intención y las respuestas viajan
 * de la aclaración a la revisión y de ahí al proyecto: si cada ruta las
 * validara a su manera, una podría aceptar lo que otra rechaza.
 */

export const Area = z.enum(["carrera", "abundancia", "salud", "amor", "confianza", "libertad"]);

export const Intention = z.string().min(1).max(600);

/** Lo que la persona quiere manifestar: 3 deseos, uno por casilla (una escena cada uno). */
export const Desires = z.array(z.string().trim().min(3).max(200)).length(3);

/** Las casillas unidas: es lo que se guarda como intención y da el título. */
export function intentionFrom(desires: string[]): string {
  return desires.join("\n");
}

/** Personas añadidas por el usuario: nombre, relación y sus fotos. */
export const People = z
  .array(
    z.object({
      name: z.string().trim().min(1).max(40).regex(/^[^[\]]+$/),
      relation: z.string().trim().max(40).optional(),
      photoUrls: z.array(z.string().startsWith("/media/uploads/")).min(1).max(3),
    }),
  )
  .max(4)
  .default([]);

/** Lo que el guion necesita saber de ellas (sin fotos). */
export const PeopleNames = z
  .array(z.object({ name: z.string().trim().min(1).max(40).regex(/^[^[\]]+$/), relation: z.string().trim().max(40).optional() }))
  .max(4)
  .default([]);

export const Details = z
  .array(
    z.object({
      question: z.string().min(1).max(200),
      answer: z.string().max(300),
    }),
  )
  .max(10)
  .default([]);
