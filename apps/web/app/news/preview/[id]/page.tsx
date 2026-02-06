import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { requirePermission } from '@/lib/auth-utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { MarketingHeader } from '@/components/shared/marketing-header';
import Footer from '@/components/landing/footer';

interface NewsArticle {
  _id: ObjectId;
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
  published: boolean;
}

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Preview | SODAX CMS',
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewsPreviewPage({ params }: PageProps) {
  // Require CMS permission to view preview
  try {
    await requirePermission('news');
  } catch {
    redirect('/cms/login');
  }

  const { id } = await params;

  // Fetch article by ID (not slug), regardless of published status
  let article: NewsArticle | null = null;
  try {
    article = await getDb()
      .collection<NewsArticle>('news')
      .findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error('Failed to fetch article for preview:', error);
  }

  if (!article) {
    redirect('/cms/news');
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

  return (
    <div className="min-h-screen w-full bg-[var(--almost-white)]">
      {/* Preview Banner */}
      <div className="bg-[var(--yellow-soda)] text-[var(--espresso)] py-3 px-4 text-center sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <span className="font-bold">⚠️ PREVIEW MODE</span>
          <span className="text-sm">
            This article is {article.published ? 'published' : 'a draft'} — You are viewing it as it will appear to
            visitors
          </span>
          <Link
            href={`/cms/news/${id}`}
            className="ml-4 px-3 py-1 bg-[var(--espresso)] text-white text-sm font-medium rounded-md hover:bg-opacity-90 transition-colors"
          >
            Edit Article
          </Link>
          <Link
            href="/cms/news"
            className="px-3 py-1 bg-white text-[var(--espresso)] text-sm font-medium rounded-md hover:bg-opacity-90 transition-colors border border-[var(--espresso)]"
          >
            Back to CMS
          </Link>
        </div>
      </div>

      <MarketingHeader backLink="/news" backText="← news" />
      <div className="max-w-7xl mx-auto">
        {/* Article */}
        <article className="py-8">
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
              <h1 className="text-4xl md:text-5xl font-black text-[var(--espresso)] leading-tight mb-4">
                {article.title}
              </h1>

              <p className="text-xl text-[var(--clay)] leading-relaxed mb-6">{article.excerpt}</p>

              <div className="flex items-center gap-4 text-sm text-[var(--clay-light)] pb-6 border-b border-[var(--clay-light)]">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--espresso)]">{article.authorName}</span>
                </div>
                <span>•</span>
                <time dateTime={publishedTime}>{formatDate(article.publishedAt || article.createdAt)}</time>
                {modifiedTime && <meta itemProp="dateModified" content={modifiedTime} />}
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

            {/* Back to CMS */}
            <div className="mt-12">
              <Link
                href="/cms/news"
                className="inline-flex items-center gap-2 text-[var(--cherry-soda)] font-medium hover:gap-3 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <title>Back arrow</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to CMS
              </Link>
            </div>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  );
}
