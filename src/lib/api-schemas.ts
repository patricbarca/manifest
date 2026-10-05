import { z } from "zod";

/**
 * Esquemas que comparten varias rutas. La intención y las respuestas viajan
 * de la aclaración a la revisión y de ahí al proyecto: si cada ruta las
 * validara a su manera, una podría aceptar lo que otra rechaza.
 */

export const Area = z.enum(["carrera", "abundancia", "salud", "amor", "confianza", "libertad"]);

export const Intention = z.string().min(1).max(600);

/** Lo que la persona quiere manifestar: de 1 a 6 cosas, una por casilla. */
export const Desires = z.array(z.string().trim().min(3).max(200)).min(1).max(6);

/** Las casillas unidas: es lo que se guarda como intención y da el título. */
export function intentionFrom(desires: string[]): string {
  return desires.join("\n");
}

export const Details = z
  .array(
    z.object({
      question: z.string().min(1).max(200),
      answer: z.string().max(300),
    }),
  )
  .max(10)
  .default([]);
