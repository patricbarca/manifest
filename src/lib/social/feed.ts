import type { Project } from "../types";
import type { FeedPost } from "@/components/ProfileFeed";

/**
 * Publicaciones del perfil. El dueño ve todos sus vídeos terminados; los demás
 * solo los que activó, y de ellos solo las escenas que no ocultó.
 */
export function feedPosts(projects: Project[], owner: boolean): FeedPost[] {
  return projects
    .filter((p) => p.status === "ready")
    .map((p) => {
      const visible = (p.highlights ?? []).filter((h) => !h.hidden);
      const shared = !!p.showOnProfile && visible.length > 0;
      return { id: p.id, title: p.script?.title || p.title, items: owner ? (shared ? visible : p.highlights ?? []) : visible, shared };
    })
    .filter((post) => owner || post.shared);
}
