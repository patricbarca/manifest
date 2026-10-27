import type { Manifestation } from "../types";
import type { HighlightGroup } from "@/components/Highlights";

export type FeedPost = HighlightGroup & { shared: boolean; createdAt?: number };

/**
 * Lo que se ve de alguien en su perfil y en el feed: un highlight por cada
 * manifestación que activó (la escena animada, sin el deseo ni su vídeo completo).
 */
export function manifestPosts(list: Manifestation[]): FeedPost[] {
  return list
    .filter((m) => m.status === "ready" && m.onProfile && m.highlight)
    .map((m) => ({ id: m.id, createdAt: m.createdAt, title: m.title, items: [m.highlight!], shared: true }));
}
