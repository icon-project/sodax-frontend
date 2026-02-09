import type { Metadata } from 'next';
import { cache } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { sanitizeHtml } from '@/lib/sanitize';
import { MarketingHeader } from '@/components/shared/marketing-header';
import Footer from '@/components/landing/footer';
import { ShareButton } from '@/components/news/share-button';

interface NewsArticle {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  authorName: string;
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  categories: string[];
}

// Use React.cache() for per-request deduplication
const getArticleBySlug = cache(async (slug: string): Promise<NewsArticle | null> => {
  try {
    const article = await getDb().collection<NewsArticle>('news').findOne({ slug, published: true });
    return article;
  } catch (error) {
    console.error('Failed to fetch article:', error);
    return null;
  }
});

const getAllPublishedSlugs = cache(async (): Promise<string[]> => {
  try {
    const articles = await getDb()
      .collection<NewsArticle>('news')
      .find({ published: true })
      .project({ slug: 1 })
      .toArray();
    return articles.map(article => article.slug);
  } catch (error) {
    console.error('Failed to fetch slugs:', error);
    return [];
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found | SODAX',
    };
  }

  const title = article.metaTitle || `${article.title} | SODAX News`;
  const description = article.metaDescription || article.excerpt;
  const canonicalUrl = `https://sodax.com/news/${article.slug}`;
  const publishedTime = (article.publishedAt || article.createdAt).toISOString();
  const modifiedTime = article.updatedAt?.toISOString();

  return {
    title,
    description,
    keywords: [
      'SODAX',
      'DeFi news',
      'blockchain',
      'cryptocurrency',
      'liquidity layer',
      ...article.tags,
      ...article.categories,
    ],
    authors: [{ name: article.authorName }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      siteName: 'SODAX',
      publishedTime,
      modifiedTime,
      authors: [article.authorName],
      tags: article.tags,
      section: article.categories[0] || 'News',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@gosodax',
      creator: '@gosodax',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map(slug => ({ slug }));
}

// Increase revalidate to reduce Vercel bandwidth and function invocations
export const revalidate = 3600; // Revalidate every hour

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const publishedTime = (article.publishedAt || article.createdAt).toISOString();
  const modifiedTime = article.updatedAt?.toISOString();
  const imageUrl = article.image || 'https://sodax.com/og-news.png';

  // Generate JSON-LD structured data for article
  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      width: 1200,
      height: 630,
    },
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      '@type': article.authorName === 'SODAX Team' ? 'Organization' : 'Person',
      name: article.authorName,
      ...(article.authorName === 'SODAX Team' && { url: 'https://sodax.com' }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'SODAX',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sodax.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://sodax.com/news/${article.slug}`,
    },
    articleSection: article.categories[0] || 'News',
    keywords: article.tags.join(', '),
    // Speakable schema for voice assistants (Google Assistant, Alexa, etc.)
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['article h1', 'article header p'],
    },
    // About entities for better AI/LLM understanding
    about: [
      {
        '@type': 'Thing',
        name: 'SODAX',
        description: 'DeFi execution layer for swapping, lending, and borrowing',
        url: 'https://sodax.com',
      },
      {
        '@type': 'Thing',
        name: 'Decentralized Finance',
        sameAs: 'https://en.wikipedia.org/wiki/Decentralized_finance',
      },
    ],
    // Accessibility metadata
    accessMode: ['textual', 'visual'],
    accessibilityFeature: ['structuredNavigation', 'readingOrder'],
    accessibilityHazard: 'none',
  };

  // Breadcrumb structured data
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://sodax.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'News',
        item: 'https://sodax.com/news',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `https://sodax.com/news/${article.slug}`,
      },
    ],
  };

  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }} />
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }} />
      <div className="min-h-screen w-full bg-[var(--almost-white)]">
        <MarketingHeader backLink="/news" backText="← news" />
        <div className="max-w-7xl mx-auto">
          {/* Article */}
          <article className="py-8" itemScope itemType="https://schema.org/NewsArticle">
            <div className="container mx-auto px-4 max-w-4xl">
              {/* Breadcrumb */}
              <nav className="mb-6 text-sm text-[var(--clay)]" aria-label="Breadcrumb">
                <Link href="/news" className="hover:text-[var(--cherry-soda)] transition-colors">
                  News
                </Link>
                <span className="mx-2">/</span>
                <span className="text-[var(--espresso)]">{article.title}</span>
              </nav>

              {/* Header */}
              <header className="mb-8">
                <h1
                  className="text-4xl md:text-5xl font-black text-[var(--espresso)] leading-tight mb-4"
                  itemProp="headline"
                >
                  {article.title}
                </h1>

                <p className="text-xl text-[var(--clay)] leading-relaxed mb-6" itemProp="description">
                  {article.excerpt}
                </p>

                <div className="flex items-center gap-4 text-sm text-[var(--clay-light)] pb-6 border-b border-[var(--clay-light)]">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-medium text-[var(--espresso)]"
                      itemProp="author"
                      itemScope
                      itemType="https://schema.org/Person"
                    >
                      <span itemProp="name">{article.authorName}</span>
                    </span>
                  </div>
                  <span>•</span>
                  <time itemProp="datePublished" dateTime={publishedTime}>
                    {formatDate(article.publishedAt || article.createdAt)}
                  </time>
                  {modifiedTime && <meta itemProp="dateModified" content={modifiedTime} />}
                  <div className="ml-auto">
                    <ShareButton title={article.title} url={`https://sodax.com/news/${article.slug}`} />
                  </div>
                </div>
              </header>

              {/* Featured Image */}
              {article.image && (
                <div className="relative aspect-[16/9] bg-[var(--cream)] rounded-xl overflow-hidden mb-8 shadow-lg">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 1200px) 100vw, 1200px"
                    className="object-cover"
                    priority
                    itemProp="image"
                  />
                </div>
              )}

              {/* Content - sanitized to prevent XSS */}
              <div
                className="tiptap prose prose-lg max-w-none
                  prose-headings:font-black prose-headings:text-[var(--espresso)]
                  prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
                  prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-[var(--clay)] prose-p:leading-relaxed prose-p:mb-6
                  prose-a:text-[var(--cherry-soda)] prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-strong:text-[var(--espresso)] prose-strong:font-bold
                prose-ul:list-disc prose-ul:pl-6 prose-ul:my-6
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-6
                prose-li:text-[var(--clay)] prose-li:mb-2 prose-li:leading-relaxed
                prose-blockquote:border-l-4 prose-blockquote:border-[var(--cherry-soda)] 
                prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-[var(--clay)]
                prose-code:text-[var(--cherry-soda)] prose-code:bg-[var(--cream)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-[var(--espresso)] prose-pre:text-[var(--cream-white)] prose-pre:rounded-lg
                prose-hr:border-[var(--clay-light)] prose-hr:my-8"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized with sanitize-html library
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
              />

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-[var(--clay-light)]">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-[var(--cream)] text-[var(--espresso)] text-sm font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Back to News */}
              <div className="mt-12">
                <Link
                  href="/news"
                  className="inline-flex items-center gap-2 text-[var(--cherry-soda)] font-medium hover:gap-3 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <title>Back arrow</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to News
                </Link>
              </div>
            </div>
          </article>
        </div>
        <Footer />
      </div>
    </>
  );
}
