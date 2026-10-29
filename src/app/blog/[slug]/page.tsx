import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogBody } from "@/components/BlogBody";
import { Icon } from "@/components/Icon";
import { POSTS, SITE_URL, postBySlug } from "@/lib/blog";
import { dictionaryFor, fill } from "@/lib/i18n";
import { templateBySlug } from "@/lib/templates";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = postBySlug((await params).slug);
  if (!post) return {};
  const languages: Record<string, string> = { [post.locale]: `/blog/${post.slug}` };
  if (post.translation) languages[post.locale === "es" ? "en" : "es"] = `/blog/${post.translation}`;
  return {
    title: `${post.title} — ManifestLifeAI`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}`, languages },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      locale: post.locale === "es" ? "es_ES" : "en_US",
      publishedTime: post.date,
      siteName: "ManifestLifeAI",
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = postBySlug((await params).slug);
  if (!post) notFound();
  // El artículo se pinta en su idioma, sea cual sea el de la web.
  const t = dictionaryFor(post.locale);
  const template = post.template ? templateBySlug(post.template) : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: post.locale,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    author: { "@type": "Organization", name: "ManifestLifeAI" },
    publisher: { "@type": "Organization", name: "ManifestLifeAI", logo: `${SITE_URL}/icon.svg` },
  };

  return (
    <article lang={post.locale} className="mx-auto max-w-2xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="flex items-center justify-between gap-4">
        <Link href="/blog" className="t-sub inline-flex items-center gap-1.5 text-[var(--color-label-2)] hover:text-[var(--color-label-1)]">
          <Icon name="arrow-left" size={15} />
          {t.blog.back}
        </Link>
        {post.translation && (
          <Link href={`/blog/${post.translation}`} hrefLang={post.locale === "es" ? "en" : "es"} className="t-caption text-[var(--color-label-3)] underline-offset-4 hover:underline">
            {t.blog.readIn}
          </Link>
        )}
      </div>

      <header className="mt-10">
        <p className="t-caption text-[var(--color-label-3)]">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString(post.locale, { day: "numeric", month: "long", year: "numeric" })}
          </time>
          {" · "}
          {fill(t.blog.minRead, { n: post.readingMinutes })}
        </p>
        <h1 className="t-title mt-3 text-balance">{post.title}</h1>
        <p className="t-body mt-4 text-[var(--color-label-2)]">{post.description}</p>
      </header>

      <div className="mt-10">
        <BlogBody blocks={post.body} />
      </div>

      {template && (
        <Link href={`/market/${template.slug}`} className="card interactive mt-12 block rounded-[var(--radius-lg)] p-6">
          <p className="t-caption text-[var(--color-label-3)]">{t.blog.relatedTemplate}</p>
          <p className="t-headline mt-1">{template.title[post.locale]}</p>
          <p className="t-sub mt-1 text-[var(--color-label-2)]">{template.summary[post.locale]}</p>
        </Link>
      )}

      <section className="card mt-6 rounded-[var(--radius-lg)] p-8 text-center">
        <h2 className="t-headline">{t.blog.ctaTitle}</h2>
        <p className="t-sub mx-auto mt-2 max-w-md text-[var(--color-label-2)]">{t.blog.ctaBody}</p>
        <Link href="/create" className="interactive mt-6 inline-block rounded-full bg-white px-6 py-2.5 text-[15px] font-medium text-black hover:bg-white/90">
          {t.blog.ctaButton}
        </Link>
      </section>
    </article>
  );
}
