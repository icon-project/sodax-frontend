import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const article = await db.collection<NewsArticle>('news').findOne({ slug, published: true });

    if (!article) {
      return {
        title: 'Article Not Found | SODAX',
      };
    }

    return {
      title: article.metaTitle || `${article.title} | SODAX News`,
      description: article.metaDescription || article.excerpt,
      openGraph: {
        title: article.metaTitle || article.title,
        description: article.metaDescription || article.excerpt,
        images: article.image ? [article.image] : [],
        type: 'article',
        publishedTime: article.publishedAt?.toISOString(),
        authors: [article.authorName],
        tags: article.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: article.metaTitle || article.title,
        description: article.metaDescription || article.excerpt,
        images: article.image ? [article.image] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Article Not Found | SODAX',
    };
  }
}

export async function generateStaticParams() {
  try {
    const articles = await db.collection<NewsArticle>('news').find({ published: true }).project({ slug: 1 }).toArray();

    return articles.map(article => ({
      slug: article.slug,
    }));
  } catch (error) {
    return [];
  }
}

export const revalidate = 3600; // Revalidate every hour

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await db.collection<NewsArticle>('news').findOne({ slug, published: true });

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

  return (
    <div className="min-h-screen bg-[var(--almost-white)]">
      {/* Header */}
      <header className="bg-[var(--cherry-soda)] text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="text-2xl font-black tracking-tight">SODAX</div>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                Home
              </Link>
              <Link href="/news" className="hover:opacity-80 transition-opacity">
                News
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-[var(--clay)]">
            <Link href="/news" className="hover:text-[var(--cherry-soda)] transition-colors">
              News
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--espresso)]">{article.title}</span>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-[var(--espresso)] leading-tight mb-4">
              {article.title}
            </h1>

            <p className="text-xl text-[var(--clay)] leading-relaxed mb-6">{article.excerpt}</p>

            <div className="flex items-center gap-4 text-sm text-[var(--clay-light)] pb-6 border-b border-[var(--clay-light)]">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--espresso)]">{article.authorName}</span>
              </div>
              <span>•</span>
              <time>{formatDate(article.publishedAt || article.createdAt)}</time>
            </div>
          </header>

          {/* Featured Image */}
          {article.image && (
            <div className="relative aspect-[16/9] bg-[var(--cream)] rounded-xl overflow-hidden mb-8 shadow-lg">
              <Image src={article.image} alt={article.title} fill className="object-cover" priority />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-black prose-headings:text-[var(--espresso)]
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-[var(--clay)] prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-[var(--cherry-soda)] prose-a:font-medium prose-a:no-underline hover:prose-a:underline
              prose-strong:text-[var(--espresso)] prose-strong:font-bold
              prose-ul:my-6 prose-li:text-[var(--clay)] prose-li:mb-2
              prose-ol:my-6
              prose-blockquote:border-l-4 prose-blockquote:border-[var(--cherry-soda)] 
              prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-[var(--clay)]
              prose-code:text-[var(--cherry-soda)] prose-code:bg-[var(--cream)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-[var(--espresso)] prose-pre:text-[var(--cream-white)] prose-pre:rounded-lg
              prose-hr:border-[var(--clay-light)] prose-hr:my-8"
            dangerouslySetInnerHTML={{ __html: article.content }}
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to News
            </Link>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-[var(--espresso)] text-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-2xl font-black mb-2">SODAX</div>
            <p className="text-[var(--clay-light)] text-sm">The unified liquidity layer for DeFi</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
