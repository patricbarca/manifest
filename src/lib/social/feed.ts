import type { Project } from "../types";
import type { FeedPost } from "@/components/ProfileFeed";

/**
 * Publicaciones del perfil. El dueño ve todos sus vídeos terminados; los demás
 * solo los que activó para mostrar, y de ellos solo los highlights.
 */
export function feedPosts(projects: Project[], owner: boolean): FeedPost[] {
  return projects
    .filter((p) => p.status === "ready" && (owner || (p.showOnProfile && p.highlights?.length)))
    .map((p) => ({
      id: p.id,
      title: p.script?.title || p.title,
      items: p.highlights ?? [],
      shared: !!(p.showOnProfile && p.highlights?.length),
    }));
}
