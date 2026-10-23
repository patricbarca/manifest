/**
 * Configuración pública de Supabase Auth, leída en tiempo de ejecución.
 * (No usamos NEXT_PUBLIC_*: Next las fija al compilar y en Railway no hay
 * variables durante la compilación.)
 */
export function authConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export function authEnabled(): boolean {
  return authConfig() !== null;
}
