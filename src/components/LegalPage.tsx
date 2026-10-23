import { legalDoc, type LegalDoc } from "@/lib/legal";
import type { Locale } from "@/lib/i18n/locale";

export function LegalPage({ doc, locale }: { doc: LegalDoc; locale: Locale }) {
  const { title, updated, sections } = legalDoc(doc, locale);
  return (
    <article className="mx-auto max-w-2xl px-6 pt-16 pb-10">
      <h1 className="t-title">{title}</h1>
      <p className="t-caption mt-3 text-[var(--color-label-3)]">{updated}</p>
      {sections.map((s) => (
        <section key={s.h} className="mt-10">
          <h2 className="t-headline">{s.h}</h2>
          {s.p.map((para) => (
            <p key={para} className="t-sub mt-3 leading-relaxed text-pretty text-[var(--color-label-2)]">
              {para}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
