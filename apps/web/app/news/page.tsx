import type { Metadata } from 'next';
import { cache } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/db';
import { MarketingHeader } from '@/components/shared/marketing-header';
import Footer from '@/components/landing/footer';
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  SparkleIcon,
  ChatsCircleIcon,
  RssSimpleIcon,
} from '@phosphor-icons/react/dist/ssr';
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
      images: [
        {
          url: 'https://sodax.com/og-news.png',
          width: 1200,
          height: 630,
          alt: 'SODAX News',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@gosodax',
      creator: '@gosodax',
      title,
      description,
      images: ['https://sodax.com/og-news.png'],
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

        {/* Category Top Bar - News navigation */}
        <div className="sticky top-0 z-40 bg-white border-b-2 border-[var(--cherry-soda)] shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-6 px-4 py-3 min-w-max">
                <Link
                  href="/news"
                  className={`text-sm font-bold transition-colors whitespace-nowrap ${
                    !category ? 'text-[var(--cherry-soda)]' : 'text-[var(--clay)] hover:text-[var(--cherry-soda)]'
                  }`}
                >
                  All News
                </Link>
                <Link
                  href="/news?category=product"
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${
                    category === 'product'
                      ? 'text-[var(--cherry-soda)] font-bold'
                      : 'text-[var(--clay)] hover:text-[var(--cherry-soda)]'
                  }`}
                >
                  Product Updates
                </Link>
                <Link
                  href="/news?category=partnerships"
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${
                    category === 'partnerships'
                      ? 'text-[var(--cherry-soda)] font-bold'
                      : 'text-[var(--clay)] hover:text-[var(--cherry-soda)]'
                  }`}
                >
                  Partnerships
                </Link>
                <Link
                  href="/news?category=community"
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${
                    category === 'community'
                      ? 'text-[var(--cherry-soda)] font-bold'
                      : 'text-[var(--clay)] hover:text-[var(--cherry-soda)]'
                  }`}
                >
                  Community
                </Link>
                <Link
                  href="/news?category=technical"
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${
                    category === 'technical'
                      ? 'text-[var(--cherry-soda)] font-bold'
                      : 'text-[var(--clay)] hover:text-[var(--cherry-soda)]'
                  }`}
                >
                  Technical
                </Link>
                <div className="ml-auto pl-6 border-l border-[var(--clay-light)]">
                  <span className="text-xs text-[var(--clay)] font-medium">
                    {filteredArticles.length} {filteredArticles.length === 1 ? 'Article' : 'Articles'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar Layout */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Title for SEO - Visually Hidden */}
          <h1 className="sr-only">
            {category
              ? `${categoryTitles[category] || category} | SODAX News`
              : 'SODAX News - Latest Updates & Insights'}
          </h1>
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            {/* Main Content Area */}
            <div className="min-w-0">
              {/* Featured Article */}
              <section className="bg-white border-2 border-[var(--cherry-soda)] rounded-lg overflow-hidden mb-8 shadow-lg">
                <div className="p-6 md:p-8">
                  <Link href={`/news/${featured.slug}`} className="group block">
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                      {featured.image && (
                        <div className="relative aspect-[16/9] bg-[var(--cream)] rounded-lg overflow-hidden">
                          <Image
                            src={featured.image}
                            alt={featured.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            priority
                          />
                        </div>
                      )}
                      <div className={!featured.image ? 'md:col-span-2' : ''}>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--cherry-soda)] text-white text-xs font-bold uppercase tracking-wide rounded-full mb-4">
                          <SparkleIcon className="w-3 h-3" />
                          Featured
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-[var(--espresso)] leading-tight mb-3 group-hover:text-[var(--cherry-soda)] transition-colors">
                          {featured.title}
                        </h2>
                        <p className="text-base text-[var(--clay)] leading-relaxed mb-4">{featured.excerpt}</p>
                        <div className="flex items-center gap-4 text-sm text-[var(--clay-light)]">
                          <time>{formatDate(featured.publishedAt || featured.createdAt)}</time>
                          <span className="inline-flex items-center gap-1 text-[var(--cherry-soda)] font-medium group-hover:gap-2 transition-all">
                            Read more <ArrowUpRightIcon className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </section>

              {/* Secondary Articles */}
              {secondary.length > 0 && (
                <section className="mb-8" aria-labelledby="top-stories">
                  <h2
                    id="top-stories"
                    className="text-xl font-black text-[var(--espresso)] mb-4 pb-2 border-b-2 border-[var(--cherry-soda)]"
                  >
                    Top Stories
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {secondary.map(article => (
                      <Link
                        key={article._id}
                        href={`/news/${article.slug}`}
                        className="group bg-white p-5 rounded-lg hover:shadow-lg transition-all duration-300 border border-[var(--clay-light)] hover:border-[var(--cherry-soda)]"
                      >
                        {article.image && (
                          <div className="relative aspect-[16/9] bg-[var(--cream)] rounded-lg overflow-hidden mb-3">
                            <Image
                              src={article.image}
                              alt={article.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <h3 className="text-lg font-bold text-[var(--espresso)] leading-tight mb-2 group-hover:text-[var(--cherry-soda)] transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-[var(--clay)] mb-2 line-clamp-2">{article.excerpt}</p>
                        <time className="text-xs text-[var(--clay-light)]">
                          {formatDate(article.publishedAt || article.createdAt)}
                        </time>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Grid Articles */}
              <LatestUpdatesSection articles={grid} />
            </div>

            {/* Sidebar - Highlights */}
            <aside className="space-y-6">
              {/* SDK Documentation Highlight */}
              <div className="space-y-6">
                <div className="group relative bg-gradient-to-br from-[var(--cherry-soda)] to-[var(--cherry-dark)] rounded-xl p-6 shadow-lg border border-[var(--cherry-soda)]/20 hover:shadow-xl transition-all duration-300">
                  {/* Decorative elements */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />

                  {/* Content */}
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <BookOpenIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">Developer Docs</h3>
                        <p className="text-xs text-white/80">Build with SODAX SDK</p>
                      </div>
                    </div>

                    <p className="text-sm text-white/90 mb-5 leading-relaxed">
                      Comprehensive guides, API references, and tutorials to integrate SODAX into your DeFi application.
                    </p>

                    <Link
                      href="https://docs.sodax.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[var(--cherry-soda)] font-semibold text-sm rounded-lg hover:bg-white/95 transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      View Documentation
                      <ArrowUpRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Social Media Block */}
                <div className="bg-white rounded-xl p-6 border border-[var(--clay-light)] shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-gradient-to-br from-[var(--cherry-soda)] to-[var(--cherry-dark)] rounded-lg">
                      <ChatsCircleIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[var(--espresso)]">Join the Community</h3>
                      <p className="text-xs text-[var(--clay)]">Follow us on social media</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--clay)] mb-5 leading-relaxed">
                    Stay connected with the latest updates, discussions, and community events.
                  </p>
                  <div className="space-y-2.5">
                    <Link
                      href="https://x.com/gosodax"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-[var(--cream)]/50 rounded-lg border border-transparent hover:border-[var(--cherry-soda)] hover:bg-[var(--cream)] transition-all duration-200 cursor-pointer group"
                    >
                      <div className="p-1.5 bg-black rounded-md">
                        <svg className="w-4 h-4 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <title>X (Twitter)</title>
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-sm text-[var(--espresso)]">Follow on X</span>
                      <ArrowUpRightIcon className="w-4 h-4 ml-auto text-[var(--clay)] group-hover:text-[var(--cherry-soda)] transition-colors" />
                    </Link>
                    <Link
                      href="https://www.reddit.com/r/SODAX/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-[var(--cream)]/50 rounded-lg border border-transparent hover:border-[var(--cherry-soda)] hover:bg-[var(--cream)] transition-all duration-200 cursor-pointer group"
                    >
                      <div className="p-1.5 bg-[#FF4500] rounded-md">
                        <svg className="w-4 h-4 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <title>Reddit</title>
                          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-sm text-[var(--espresso)]">Join on Reddit</span>
                      <ArrowUpRightIcon className="w-4 h-4 ml-auto text-[var(--clay)] group-hover:text-[var(--cherry-soda)] transition-colors" />
                    </Link>
                    <Link
                      href="https://www.youtube.com/@gosodax"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-[var(--cream)]/50 rounded-lg border border-transparent hover:border-[var(--cherry-soda)] hover:bg-[var(--cream)] transition-all duration-200 cursor-pointer group"
                    >
                      <div className="p-1.5 bg-[#FF0000] rounded-md">
                        <svg className="w-4 h-4 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <title>YouTube</title>
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-sm text-[var(--espresso)]">Watch on YouTube</span>
                      <ArrowUpRightIcon className="w-4 h-4 ml-auto text-[var(--clay)] group-hover:text-[var(--cherry-soda)] transition-colors" />
                    </Link>
                  </div>
                </div>

                {/* RSS Feed Block */}
                <div className="bg-white rounded-xl p-6 border border-[var(--clay-light)] shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-gradient-to-br from-[var(--cherry-soda)] to-[var(--cherry-dark)] rounded-lg">
                      <RssSimpleIcon className="w-5 h-5 text-white" weight="bold" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[var(--espresso)]">RSS Feed</h3>
                      <p className="text-xs text-[var(--clay)]">Subscribe to updates</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--clay)] mb-5 leading-relaxed">
                    Get SODAX news delivered directly to your RSS reader. Stay informed with automatic updates.
                  </p>
                  <div className="space-y-2.5">
                    <Link
                      href="/news/feed.xml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-[var(--cream)]/50 rounded-lg border border-transparent hover:border-[var(--cherry-soda)] hover:bg-[var(--cream)] transition-all duration-200 cursor-pointer group"
                    >
                      <div className="p-1.5 bg-[#FF6600] rounded-md">
                        <RssSimpleIcon className="w-4 h-4 shrink-0 text-white" weight="bold" />
                      </div>
                      <span className="font-semibold text-sm text-[var(--espresso)]">Subscribe via RSS</span>
                      <ArrowUpRightIcon className="w-4 h-4 ml-auto text-[var(--clay)] group-hover:text-[var(--cherry-soda)] transition-colors" />
                    </Link>
                  </div>
                </div>

                {/* SODA Token Highlight */}
                {/* <div className="bg-white rounded-lg p-5 border-2 border-[var(--cream)] shadow-md mt-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-[var(--cream)] rounded-lg">
                    <TrendingUp className="w-5 h-5 text-[var(--cherry-soda)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--espresso)] mb-1">SODA Token</h3>
                    <p className="text-sm text-[var(--clay)]">Governance & Rewards</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--clay)] mb-3 leading-relaxed">
                  Learn about the SODA token utility, staking rewards, and governance participation.
                </p>
                <Link
                  href="/community/soda-token"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--cherry-soda)] hover:gap-3 transition-all"
                >
                  Explore Token
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div> */}

                {/* Partners Highlight */}
                {/* <div className="bg-white rounded-lg p-5 border-2 border-[var(--cream)] shadow-md mt-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-[var(--cream)] rounded-lg">
                    <Users className="w-5 h-5 text-[var(--cherry-soda)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--espresso)] mb-1">Partners</h3>
                    <p className="text-sm text-[var(--clay)]">Ecosystem & Case Studies</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--clay)] mb-3 leading-relaxed">
                  Discover how leading protocols integrate SODAX to enhance liquidity.
                </p>
                <div className="space-y-2 mb-3">
                  <Link
                    href="/partners/amped-finance"
                    className="block text-xs text-[var(--clay)] hover:text-[var(--cherry-soda)] transition-colors border-l-2 border-[var(--clay-light)] pl-3 py-1"
                  >
                    → Amped Finance Case Study
                  </Link>
                </div>
                <Link
                  href="/partners"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--cherry-soda)] hover:gap-3 transition-all"
                >
                  View All Partners
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div> */}

                {/* Newsletter CTA */}
                {/* <div className="bg-[var(--cream)] rounded-lg p-5 border border-[var(--clay-light)] mt-6">
                <h3 className="font-bold text-base text-[var(--espresso)] mb-2">Stay Updated</h3>
                <p className="text-sm text-[var(--clay)] mb-3">Get the latest SODAX news delivered to your inbox.</p>
                <Link
                  href="/community#newsletter"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--cherry-soda)] hover:gap-3 transition-all"
                >
                  Subscribe to Newsletter
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div> */}
              </div>
            </aside>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
