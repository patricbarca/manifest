import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignIn } from "@/components/SignIn";
import { authConfig } from "@/lib/supabase/config";
import { authUser } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** Privada: fuera de Google. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: rawNext, error } = await searchParams;
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/profile";
  const cfg = authConfig();
  if (!cfg) redirect(next);
  if (await authUser()) redirect(next);
  const { t } = await getDictionary();
  return (
    <>
      {error && <p className="t-caption mt-8 text-center text-red-300">{t.auth.error}</p>}
      <SignIn url={cfg.url} anonKey={cfg.key} next={next} t={t.auth} />
    </>
  );
}
