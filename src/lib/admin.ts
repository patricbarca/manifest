/**
 * Quién puede ver el panel (/admin): los emails de ADMIN_EMAILS (separados
 * por comas). Sin la variable, nadie.
 */
export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}
