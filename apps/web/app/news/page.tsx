import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'News | SODAX',
  description: 'Latest updates, product launches, and insights from SODAX - the unified liquidity layer for DeFi.',
};

export const revalidate = 60; // Revalidate every minute

interface NewsArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  image?: string;
  publishedAt?: Date;
  createdAt: Date;
  categories: string[];
  tags: string[];
}

async function getPublishedNews(): Promise<NewsArticle[]> {
  try {
    const news = await db
      .collection<NewsArticle>('news')
      .find({ published: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(50)
      .toArray();

    return news.map(article => ({
      ...article,
      _id: article._id.toString(),
    }));
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return [];
  }
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function NewsPage() {
  const articles = await getPublishedNews();

  if (articles.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--almost-white)] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[var(--espresso)] mb-4">No News Yet</h1>
          <p className="text-[var(--clay)] text-lg">Check back soon for updates.</p>
        </div>
      </div>
    );
  }

  const [featured, ...restArticles] = articles;
  const secondary = restArticles.slice(0, 2);
  const grid = restArticles.slice(2);

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
              <Link href="/news" className="border-b-2 border-white pb-1">
                News
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Featured Article */}
      <section className="bg-white border-b-4 border-[var(--cherry-soda)]">
        <div className="container mx-auto px-4 py-8">
          <Link href={`/news/${featured.slug}`} className="group block">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {featured.image && (
                <div className="relative aspect-[16/9] bg-[var(--cream)] rounded-lg overflow-hidden">
                  <Image
                    src={featured.image}
                    alt={featured.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                </div>
              )}
              <div className={!featured.image ? 'md:col-span-2' : ''}>
                <div className="inline-block px-3 py-1 bg-[var(--cherry-soda)] text-white text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Featured
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-[var(--espresso)] leading-tight mb-4 group-hover:text-[var(--cherry-soda)] transition-colors">
                  {featured.title}
                </h1>
                <p className="text-lg text-[var(--clay)] leading-relaxed mb-4">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-[var(--clay-light)]">
                  <time>{formatDate(featured.publishedAt || featured.createdAt)}</time>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Secondary Articles */}
      {secondary.length > 0 && (
        <section className="border-b border-[var(--clay-light)]">
          <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-6">
              {secondary.map(article => (
                <Link
                  key={article._id}
                  href={`/news/${article.slug}`}
                  className="group bg-white p-6 rounded-lg hover:shadow-xl transition-all duration-300 border border-[var(--clay-light)]"
                >
                  {article.image && (
                    <div className="relative aspect-[16/9] bg-[var(--cream)] rounded-lg overflow-hidden mb-4">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-[var(--espresso)] leading-tight mb-3 group-hover:text-[var(--cherry-soda)] transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-[var(--clay)] mb-3 line-clamp-2">{article.excerpt}</p>
                  <time className="text-sm text-[var(--clay-light)]">
                    {formatDate(article.publishedAt || article.createdAt)}
                  </time>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Grid Articles */}
      {grid.length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-black text-[var(--espresso)] mb-6 pb-3 border-b-2 border-[var(--cherry-soda)]">
              Latest Updates
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {grid.map(article => (
                <Link
                  key={article._id}
                  href={`/news/${article.slug}`}
                  className="group bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-[var(--clay-light)]"
                >
                  {article.image && (
                    <div className="relative aspect-[16/9] bg-[var(--cream)] overflow-hidden">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-[var(--espresso)] leading-tight mb-2 group-hover:text-[var(--cherry-soda)] transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-[var(--clay)] mb-3 line-clamp-2">{article.excerpt}</p>
                    <time className="text-xs text-[var(--clay-light)]">
                      {formatDate(article.publishedAt || article.createdAt)}
                    </time>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
