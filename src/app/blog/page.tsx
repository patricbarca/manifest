import type { Metadata } from "next";
import Link from "next/link";
import { POSTS, postsFor } from "@/lib/blog";
import { fill } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: `${t.blog.title} — ManifestLifeAI`,
    description: t.blog.lede,
    alternates: { canonical: "/blog" },
  };
}

export default async function BlogPage() {
  const { t, locale } = await getDictionary();
  const posts = postsFor(locale);
  // Los del otro idioma también se enlazan: así Google llega a todos.
  const others = POSTS.filter((p) => p.locale !== locale);

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <header>
        <h1 className="t-display">{t.blog.title}</h1>
        <p className="t-body mt-5 max-w-xl text-[var(--color-label-2)]">{t.blog.lede}</p>
      </header>

      <ul className="mt-14 space-y-4">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="card interactive block rounded-[var(--radius-lg)] p-7">
              <p className="t-caption text-[var(--color-label-3)]">
                <time dateTime={p.date}>{new Date(p.date).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}</time>
                {" · "}
                {fill(t.blog.minRead, { n: p.readingMinutes })}
              </p>
              <h2 className="t-headline mt-2 text-balance">{p.title}</h2>
              <p className="t-sub mt-2 text-[var(--color-label-2)]">{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>

      {others.length > 0 && (
        <section className="mt-16">
          <h2 className="t-sub font-medium text-[var(--color-label-3)]">{t.blog.otherLanguage}</h2>
          <ul className="mt-3 space-y-2">
            {others.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} hrefLang={p.locale} className="t-sub text-[var(--color-label-2)] underline-offset-4 hover:underline">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
