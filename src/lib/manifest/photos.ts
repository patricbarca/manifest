import { access } from "node:fs/promises";
import type { User } from "../types";
import { localPathForMediaUrl } from "../paths";

/** Las fotos guardadas de la persona que aún existen (se borran a los 30 días). */
export async function livePhotos(user: User): Promise<string[]> {
  const out: string[] = [];
  for (const url of user.photoUrls ?? []) {
    if (!url.split("/").pop()?.startsWith(`${user.id}_`)) continue;
    const abs = localPathForMediaUrl(url);
    if (!abs) continue;
    try {
      await access(abs);
      out.push(url);
    } catch {
      /* caducada */
    }
  }
  return out;
}
