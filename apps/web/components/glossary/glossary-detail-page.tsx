import { notFound } from 'next/navigation';
import { getNotionPageBySlug } from '@/lib/notion';
import { getGlossaryTerms, injectGlossaryLinks } from '@/lib/glossary-linker';
import Link from 'next/link';
import { MarketingHeader } from '@/components/shared/marketing-header';
import Footer from '@/components/landing/footer';
import { BookOpenIcon } from '@phosphor-icons/react/dist/ssr';
import { DecorativeDivider } from '@/components/ui/decorative-divider';
import type { Metadata } from 'next';

// ── Configuration type ───────────────────────────────────────────────
export interface GlossaryPageConfig {
  /** Notion database key passed to notion lib */
  notionDb: 'concepts' | 'system';
  /** URL path segment, e.g. "concepts" or "system" */
  routeSegment: string;
  /** Meta title suffix, e.g. "SODAX Concept" */
  label: string;
  /** Meta title tail, e.g. "Cross-Chain DeFi Guide" */
  titleSuffix: string;
  /** Template for meta description – receives the page title */
  descriptionTemplate: (title: string) => string;
  /** Extra keywords injected after the title */
  extraKeywords: string[];
  /** OG / Twitter image path */
  ogImage: string;
  /** Schema.org @type for the article node */
  schemaType: 'Article' | 'TechArticle';
  /** Schema.org articleSection value */
  articleSection: string;
  /** Schema.org "about" block */
  schemaAbout: Record<string, string>;
}

// ── Pre-built configs ────────────────────────────────────────────────
export const CONCEPT_CONFIG: GlossaryPageConfig = {
  notionDb: 'concepts',
  routeSegment: 'concepts',
  label: 'SODAX Concept',
  titleSuffix: 'Cross-Chain DeFi Guide',
  descriptionTemplate: title => `Understand ${title} in cross-chain DeFi with SODAX.`,
  extraKeywords: ['DeFi concept', 'cross-chain', 'blockchain'],
  ogImage: '/og-concept.png',
  schemaType: 'Article',
  articleSection: 'Concepts',
  schemaAbout: { '@type': 'Thing', name: 'Cross-chain DeFi' },
};

export const SYSTEM_CONFIG: GlossaryPageConfig = {
  notionDb: 'system',
  routeSegment: 'system',
  label: 'SODAX System Component',
  titleSuffix: 'Cross-Chain DeFi Documentation',
  descriptionTemplate: title => `Learn about ${title} in the SODAX cross-chain DeFi system.`,
  extraKeywords: ['system component', 'cross-chain', 'DeFi'],
  ogImage: '/og-system-component.png',
  schemaType: 'TechArticle',
  articleSection: 'System Components',
  schemaAbout: { '@type': 'SoftwareApplication', name: 'SODAX', applicationCategory: 'DeFi Platform' },
};

// ── Shared metadata generator ────────────────────────────────────────
export async function generateGlossaryMetadata(slug: string, config: GlossaryPageConfig): Promise<Metadata> {
  const data = await getNotionPageBySlug(config.notionDb, slug);
  if (!data) return {};

  const { page } = data;
  const title = page.properties.Title.title[0]?.plain_text || '';
  const description = page.properties['One-sentency summary'].rich_text[0]?.plain_text || '';
  const tags = page.properties.Tags.multi_select.map(t => t.name);
  const url = `https://sodax.com/${config.routeSegment}/${slug}`;

  return {
    title: `${title} - ${config.label} | ${config.titleSuffix}`,
    description: `${description} ${config.descriptionTemplate(title)}`,
    keywords: ['SODAX', title, ...config.extraKeywords, ...tags],
    authors: [{ name: 'SODAX Team' }],
    openGraph: {
      title: `${title} - ${config.label}`,
      description,
      url,
      siteName: 'SODAX',
      type: 'article',
      modifiedTime: page.last_edited_time,
      tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - ${config.label}`,
      description,
      creator: '@gosodax',
    },
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  };
}

// ── Shared page component ────────────────────────────────────────────
export default async function GlossaryDetailPage({
  slug,
  config,
}: {
  slug: string;
  config: GlossaryPageConfig;
}) {
  const [data, glossaryTerms] = await Promise.all([getNotionPageBySlug(config.notionDb, slug), getGlossaryTerms()]);

  if (!data) {
    notFound();
  }

  const { page, content } = data;
  const title = page.properties.Title.title[0]?.plain_text || '';
  const summary = page.properties['One-sentency summary'].rich_text[0]?.plain_text || '';
  const tags = page.properties.Tags.multi_select.map(t => t.name);

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': config.schemaType,
        '@id': `https://sodax.com/${config.routeSegment}/${slug}`,
        headline: title,
        description: summary,
        dateModified: page.last_edited_time,
        author: { '@type': 'Organization', name: 'SODAX Team', url: 'https://sodax.com' },
        publisher: {
          '@type': 'Organization',
          name: 'SODAX',
          logo: { '@type': 'ImageObject', url: 'https://sodax.com/symbol.png' },
        },
        keywords: tags.join(', '),
        articleSection: config.articleSection,
        about: config.schemaAbout,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `https://sodax.com/${config.routeSegment}/${slug}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sodax.com' },
          { '@type': 'ListItem', position: 2, name: 'Glossary', item: 'https://sodax.com/glossary' },
          { '@type': 'ListItem', position: 3, name: title },
        ],
      },
    ],
  };

  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="min-h-screen bg-cream-white flex flex-col w-full">
        <MarketingHeader backLink="/glossary" backText="← glossary" />
        <div className="max-w-7xl mx-auto pt-30 w-full px-4">
          <article className="py-8 flex-1 flex flex-col items-start overflow-clip w-full">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-clay" aria-label="Breadcrumb">
              <Link href="/glossary" className="hover:text-cherry-soda transition-colors">
                Glossary
              </Link>
              <span className="mx-2">/</span>
              <span className="text-espresso">{title}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
              {/* Main Content */}
              <div className="flex flex-col gap-8">
                {/* Header Section */}
                <header className="pt-2 pb-8 w-full max-w-4xl">
                  <h1 className="text-4xl md:text-5xl font-black leading-tight text-espresso mb-4">{title}</h1>
                  <p className="text-xl leading-relaxed text-clay mb-6">{summary}</p>

                  {tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap pb-6 border-b border-clay-light">
                      {tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-cream text-espresso text-sm font-medium rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </header>

                {/* Content Section */}
                <div className="bg-white rounded-3xl px-8 py-12 w-full">
                  <div
                    className="prose prose-lg max-w-none text-espresso prose-headings:font-black prose-headings:text-espresso prose-h1:text-4xl prose-h1:mt-0 prose-h1:mb-6 prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-2 prose-p:text-clay-dark prose-p:leading-relaxed prose-p:mb-6 prose-a:text-cherry-soda prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-strong:text-espresso prose-strong:font-bold prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:text-clay-dark prose-li:mb-2 prose-li:leading-relaxed prose-blockquote:border-l-4 prose-blockquote:border-cherry-soda prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-clay-dark prose-code:text-cherry-soda prose-code:bg-cream-white prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-espresso prose-pre:text-white prose-pre:rounded-lg prose-pre:my-6 prose-hr:border-cream-white prose-hr:my-8"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: Rendering trusted Notion content
                    dangerouslySetInnerHTML={{
                      __html: injectGlossaryLinks(
                        content,
                        glossaryTerms.filter(t => t.url !== `/${config.routeSegment}/${slug}`),
                        1,
                      ),
                    }}
                  />
                </div>

                {/* Footer Section */}
                <div className="bg-white rounded-3xl px-8 py-6 w-full border-t border-cream-white">
                  <div className="text-[14px] leading-[1.4] text-clay">
                    Last updated: {new Date(page.last_edited_time).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="flex flex-col gap-4">
                {/* SDK Documentation Card */}
                <div className="bg-cream-white rounded-3xl p-8 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-medium uppercase text-clay leading-[1.2]">Developer Docs</span>
                    <h3 className="font-bold text-[16px] text-espresso leading-[1.4]">Build with SODAX SDK</h3>
                    <p className="text-[14px] text-clay leading-[1.4]">
                      Comprehensive guides, API references, and tutorials to integrate SODAX into your DeFi application.
                    </p>
                  </div>
                  <DecorativeDivider />
                  <Link
                    href="https://docs.sodax.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] text-clay hover:text-espresso transition-colors"
                  >
                    <BookOpenIcon className="w-5 h-5" />
                    View documentation
                  </Link>
                </div>

                {/* Social Media Card */}
                <div className="bg-cream-white rounded-3xl p-8 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-medium uppercase text-clay leading-[1.2]">JOIN THE COMMUNITY</span>
                    <h3 className="font-bold text-[16px] text-espresso leading-[1.4]">Follow us on social media</h3>
                    <p className="text-[14px] text-clay leading-[1.4]">
                      Stay connected with the latest updates, discussions, and community events.
                    </p>
                  </div>
                  <DecorativeDivider />
                  <div className="flex flex-col gap-2">
                    <Link
                      href="https://x.com/gosodax"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[12px] text-clay hover:text-espresso transition-colors"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <title>X (Twitter)</title>
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Follow on X
                    </Link>
                    <Link
                      href="https://www.reddit.com/r/SODAX/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[12px] text-clay hover:text-espresso transition-colors"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <title>Reddit</title>
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                      </svg>
                      Join on Reddit
                    </Link>
                    <Link
                      href="https://www.youtube.com/@gosodax"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[12px] text-clay hover:text-espresso transition-colors"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <title>YouTube</title>
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      Watch on YouTube
                    </Link>
                    <Link
                      href="https://sodax.com/news/feed.xml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[12px] text-clay hover:text-espresso transition-colors"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <title>RSS</title>
                        <path d="M19.199 24C19.199 13.467 10.533 4.8 0 4.8V0c13.165 0 24 10.835 24 24h-4.801zM3.291 17.415c1.814 0 3.293 1.479 3.293 3.295 0 1.813-1.485 3.29-3.301 3.29C1.47 24 0 22.526 0 20.71s1.475-3.294 3.291-3.295zM15.909 24h-4.665c0-6.169-5.075-11.245-11.244-11.245V8.09c8.727 0 15.909 7.184 15.909 15.91z" />
                      </svg>
                      Subscribe via RSS
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </article>
        </div>

        <Footer />
      </div>
    </>
  );
}
