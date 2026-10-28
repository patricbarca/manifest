import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Terms — ManifestLifeAI" };

export default async function Page() {
  const { locale } = await getDictionary();
  return <LegalPage doc="terms" locale={locale} />;
}
