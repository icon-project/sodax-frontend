import type { Metadata } from 'next';
import { cache } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/db';
import { MarketingHeader } from '@/components/shared/marketing-header';
import Footer from '@/components/landing/footer';
import { BookOpenIcon, RssSimpleIcon } from '@phosphor-icons/react/dist/ssr';
import { DecorativeDivider } from '@/components/ui/decorative-divider';
import { LatestUpdatesSection } from './latest-updates-section';
import { formatDate } from './utils';

export async function generateMetadata(props: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const category = searchParams.category;

  const baseTitle = 'SODAX News';
  const categoryTitles: Record<string, string> = {
    product: 'Product Updates',
    partnerships: 'Partnerships & Integrations',
    community: 'Community News',
    technical: 'Technical Updates',
  };

  const title = category
    ? `${categoryTitles[category] || category} | ${baseTitle}`
    : `${baseTitle} - Latest Updates & Insights | SODAX`;

  const description = category
    ? `Stay updated with ${categoryTitles[category]?.toLowerCase() || category} from SODAX. Discover the latest developments in our DeFi unified liquidity layer.`
    : 'Stay informed with the latest news, product launches, partnerships, and technical updates from SODAX - the unified liquidity layer revolutionizing DeFi across 15+ blockchains.';

  const canonicalUrl = category ? `https://sodax.com/news?category=${category}` : 'https://sodax.com/news';

  return {
    title,
    description,
    keywords: [
      'SODAX news',
      'DeFi updates',
      'blockchain news',
      'cryptocurrency news',
      'liquidity layer',
      'DeFi protocol news',
      category && categoryTitles[category],
    ].filter(Boolean) as string[],
    alternates: {
      canonical: canonicalUrl,
      types: {
        'application/rss+xml': [
          {
            url: 'https://sodax.com/news/feed.xml',
            title: 'SODAX News RSS Feed',
          },
        ],
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'SODAX',
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

// Use longer revalidate to reduce Vercel bandwidth and function invocations
export const revalidate = 300; // Revalidate every 5 minutes

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

// Use React.cache() for per-request deduplication
const getPublishedNews = cache(async (): Promise<NewsArticle[]> => {
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
});

export default async function NewsPage(props: {
  searchParams: Promise<{ category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const articles = await getPublishedNews();
  const category = searchParams.category;

  // Filter articles by category if specified
  const filteredArticles = category
    ? articles.filter(article => article.categories.some(cat => cat.toLowerCase() === category.toLowerCase()))
    : articles;

  const categoryTitles: Record<string, string> = {
    product: 'Product Updates',
    partnerships: 'Partnerships & Integrations',
    community: 'Community News',
    technical: 'Technical Updates',
  };

  // Generate JSON-LD structured data for news listing
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category ? `${categoryTitles[category] || category} | SODAX News` : 'SODAX News',
    description: category
      ? `Stay updated with ${categoryTitles[category]?.toLowerCase() || category} from SODAX`
      : 'Latest updates, product launches, and insights from SODAX',
    url: category ? `https://sodax.com/news?category=${category}` : 'https://sodax.com/news',
    publisher: {
      '@type': 'Organization',
      name: 'SODAX',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sodax.com/logo.png',
      },
    },
    hasPart: filteredArticles.slice(0, 10).map(article => ({
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.excerpt,
      url: `https://sodax.com/news/${article.slug}`,
      image: article.image || 'https://sodax.com/og-news.png',
      datePublished: (article.publishedAt || article.createdAt).toISOString(),
      author: {
        '@type': 'Organization',
        name: 'SODAX',
      },
    })),
  };

  if (filteredArticles.length === 0 && !category) {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <div className="min-h-screen bg-[var(--almost-white)] flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[var(--espresso)] mb-4">No News Yet</h1>
            <p className="text-[var(--clay)] text-lg">Check back soon for updates.</p>
          </div>
        </div>
      </>
    );
  }

  const [featured, ...restArticles] = filteredArticles;
  const secondary = restArticles.slice(0, 2);
  const grid = restArticles.slice(2);

  if (!featured) {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <div className="min-h-screen w-full bg-[var(--almost-white)]">
          <MarketingHeader backLink="/" backText="← home" />
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="bg-white rounded-lg p-8 text-center border-2 border-[var(--clay-light)]">
              <h2 className="text-2xl font-bold text-[var(--espresso)] mb-2">
                {category ? `No articles in "${category}" category` : 'No news articles available'}
              </h2>
              <p className="text-[var(--clay)] mb-4">
                {category ? 'Try selecting a different category or view all news.' : 'Check back soon for updates.'}
              </p>
              {category && (
                <Link
                  href="/news"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--cherry-soda)] text-white font-semibold rounded-lg hover:bg-[var(--cherry-dark)] transition-colors"
                >
                  View All News
                </Link>
              )}
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="min-h-screen w-full bg-[var(--almost-white)]">
        <MarketingHeader backLink="/" backText="← home" />

        {/* Category Filter Tabs */}
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 md:justify-center md:flex-wrap scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <Link
              href="/news"
              className={`h-10 px-6 py-2 text-xs font-bold rounded-[240px] transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                !category
                  ? 'bg-[#ede6e6] text-[#483534]'
                  : 'border-[3px] border-[#ede6e6] text-[#8e7e7d] font-normal hover:bg-[#ede6e6]/50'
              }`}
            >
              All news
            </Link>
            <Link
              href="/news?category=product"
              className={`h-10 px-6 py-2 text-xs rounded-[240px] transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                category === 'product'
                  ? 'bg-[#ede6e6] text-[#483534] font-bold'
                  : 'border-[3px] border-[#ede6e6] text-[#8e7e7d] font-normal hover:bg-[#ede6e6]/50'
              }`}
            >
              Product updates
            </Link>
            <Link
              href="/news?category=partnerships"
              className={`h-10 px-6 py-2 text-xs rounded-[240px] transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                category === 'partnerships'
                  ? 'bg-[#ede6e6] text-[#483534] font-bold'
                  : 'border-[3px] border-[#ede6e6] text-[#8e7e7d] font-normal hover:bg-[#ede6e6]/50'
              }`}
            >
              Partnerships
            </Link>
            <Link
              href="/news?category=community"
              className={`h-10 px-6 py-2 text-xs rounded-[240px] transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                category === 'community'
                  ? 'bg-[#ede6e6] text-[#483534] font-bold'
                  : 'border-[3px] border-[#ede6e6] text-[#8e7e7d] font-normal hover:bg-[#ede6e6]/50'
              }`}
            >
              Community
            </Link>
            <Link
              href="/news?category=technical"
              className={`h-10 px-6 py-2 text-xs rounded-[240px] transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                category === 'technical'
                  ? 'bg-[#ede6e6] text-[#483534] font-bold'
                  : 'border-[3px] border-[#ede6e6] text-[#8e7e7d] font-normal hover:bg-[#ede6e6]/50'
              }`}
            >
              Technical
            </Link>
          </div>
        </div>

        {/* Main Content with Sidebar Layout */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          {/* Page Title for SEO - Visually Hidden */}
          <h1 className="sr-only">
            {category
              ? `${categoryTitles[category] || category} | SODAX News`
              : 'SODAX News - Latest Updates & Insights'}
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-[624px_304px] gap-4 lg:justify-center">
            {/* Main Content Area */}
            <div className="min-w-0 flex flex-col gap-4">
              {/* Featured Article */}
              <section className="bg-white rounded-[24px] overflow-hidden shadow-[0px_4px_32px_0px_#ede6e6]">
                <div className="p-2">
                  <Link
                    href={`/news/${featured.slug}`}
                    className="group flex flex-col md:flex-row gap-2 md:items-center"
                  >
                    {featured.image && (
                      <div className="relative w-full md:w-[288px] h-[200px] md:h-[180px] bg-[#ede6e6] rounded-[16px] overflow-hidden shrink-0">
                        <Image
                          src={featured.image}
                          alt={featured.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 288px"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          priority
                        />
                      </div>
                    )}
                    <div className={`flex flex-col gap-1 p-2 ${!featured.image ? 'w-full' : 'flex-1'}`}>
                      <span className="text-[9px] font-medium uppercase text-[#8e7e7d] leading-[1.2]">Featured</span>
                      <h2 className="text-[24px] font-bold text-[#483534] leading-[1.1] group-hover:text-[var(--cherry-soda)] transition-colors">
                        {featured.title}
                      </h2>
                      <p className="text-[14px] text-[#6b5c5b] leading-[1.4] line-clamp-2">{featured.excerpt}</p>
                      <div className="inline-flex items-center h-5 px-2 bg-[#ede6e6] rounded-[256px] w-fit">
                        <time className="text-[11px] text-[#8e7e7d] leading-[1.3]">
                          {formatDate(featured.publishedAt || featured.createdAt)}
                        </time>
                      </div>
                    </div>
                  </Link>
                </div>
              </section>

              {/* Secondary Articles */}
              {secondary.length > 0 && (
                <section aria-labelledby="top-stories">
                  <h2 id="top-stories" className="sr-only">
                    Top Stories
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {secondary.map(article => (
                      <Link
                        key={article._id}
                        href={`/news/${article.slug}`}
                        className="group bg-white p-2 rounded-[24px] hover:shadow-[0px_8px_40px_0px_#ede6e6] transition-all duration-300 shadow-[0px_4px_32px_0px_#ede6e6] flex flex-col gap-4"
                      >
                        {article.image && (
                          <div className="relative w-full h-[180px] bg-[#ede6e6] rounded-[16px] overflow-hidden">
                            <Image
                              src={article.image}
                              alt={article.title}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 288px"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-2 p-2">
                          <span className="text-[9px] font-medium uppercase text-[#8e7e7d] leading-[1.2]">
                            TOP STORY
                          </span>
                          <h3 className="text-[18px] font-bold text-[#483534] leading-[1.2] group-hover:text-[var(--cherry-soda)] transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-[14px] text-[#6b5c5b] leading-[1.4] line-clamp-3">{article.excerpt}</p>
                          <div className="inline-flex items-center h-5 px-2 bg-[#ede6e6] rounded-[256px] w-fit">
                            <time className="text-[11px] text-[#8e7e7d] leading-[1.3]">
                              {formatDate(article.publishedAt || article.createdAt)}
                            </time>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Grid Articles */}
              <LatestUpdatesSection articles={grid} />
            </div>

            {/* Sidebar - Highlights */}
            <aside className="flex flex-col gap-4">
              {/* SDK Documentation Card */}
              <div className="bg-[#ede6e6] rounded-[24px] p-8 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-medium uppercase text-[#8e7e7d] leading-[1.2]">Developer Docs</span>
                  <h3 className="font-bold text-[16px] text-[#483534] leading-[1.4]">Build with SODAX SDK</h3>
                  <p className="text-[14px] text-[#8e7e7d] leading-[1.4]">
                    Comprehensive guides, API references, and tutorials to integrate SODAX into your DeFi application.
                  </p>
                </div>
                <DecorativeDivider />
                <Link
                  href="https://docs.sodax.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] text-[#8e7e7d] hover:text-[#483534] transition-colors"
                >
                  <BookOpenIcon className="w-5 h-5" />
                  View documentation
                </Link>
              </div>

              {/* Social Media Card */}
              <div className="bg-[#ede6e6] rounded-[24px] p-8 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-medium uppercase text-[#8e7e7d] leading-[1.2]">
                    JOIN THE COMMUNITY
                  </span>
                  <h3 className="font-bold text-[16px] text-[#483534] leading-[1.4]">Follow us on social media</h3>
                  <p className="text-[14px] text-[#8e7e7d] leading-[1.4]">
                    Stay connected with the latest updates, discussions, and community events.
                  </p>
                </div>
                <DecorativeDivider />
                <div className="flex flex-col gap-2">
                  <Link
                    href="https://x.com/gosodax"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[12px] text-[#8e7e7d] hover:text-[#483534] transition-colors"
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
                    className="flex items-center gap-1 text-[12px] text-[#8e7e7d] hover:text-[#483534] transition-colors"
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
                    className="flex items-center gap-1 text-[12px] text-[#8e7e7d] hover:text-[#483534] transition-colors"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <title>YouTube</title>
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    Watch on YouTube
                  </Link>
                  <Link
                    href="/news/feed.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[12px] text-[#8e7e7d] hover:text-[#483534] transition-colors"
                  >
                    <RssSimpleIcon className="w-5 h-5 shrink-0" weight="bold" />
                    Subscribe via RSS
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
