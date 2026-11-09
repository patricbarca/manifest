import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getDictionary } from "@/lib/i18n/server";
import { legalDoc } from "@/lib/legal";
import { clip, pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDictionary();
  const { title, sections } = legalDoc("terms", locale);
  return pageMeta({ title: `${title} — ManifestLifeAI`, description: clip(sections[0].p[0]), path: "/terms" });
}

export default async function Page() {
  const { locale } = await getDictionary();
  return <LegalPage doc="terms" locale={locale} />;
}
