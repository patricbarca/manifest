import { cache } from "react";
import { currentUser, isSignedIn } from "../db/session";
import { authUser } from "../supabase/server";
import { ensureProfile } from "./aura";

/** La cuenta con sesión y su perfil, o null si no ha entrado. */
export const me = cache(async () => {
  if (!(await isSignedIn())) return null;
  const [user, auth] = await Promise.all([currentUser(), authUser()]);
  const profile = await ensureProfile({ id: user.id, name: user.name, email: user.email, avatarUrl: auth?.avatarUrl });
  return { user, profile };
});
