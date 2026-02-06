import type { MetadataRoute } from 'next';
import { getDb } from '@/lib/db';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sodax.com';

// ISR configuration for automatic updates without full rebuilds
// Same caching strategy as RSS feed to handle bot traffic efficiently
export const revalidate = 300; // Revalidate every 5 minutes
export const dynamic = 'force-static'; // Generate at build time

interface NewsArticle {
  slug: string;
  updatedAt: Date;
  publishedAt?: Date;
}

interface Article {
  slug: string;
  updatedAt: Date;
  publishedAt?: Date;
}

interface GlossaryTerm {
  slug: string;
  updatedAt: Date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes that are indexable and public
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/swap`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/save`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/loans`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/migrate`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/discord`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // News index page
    {
      url: `${SITE_URL}/news`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // Community pages
    {
      url: `${SITE_URL}/community/soda-token`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Partner case studies
    {
      url: `${SITE_URL}/partners/amped-finance`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  try {
    // Fetch dynamic content from CMS in parallel
    const [newsArticles, articles, glossaryTerms] = await Promise.all([
      // News articles
      getDb()
        .collection<NewsArticle>('news')
        .find({ published: true })
        .project({ slug: 1, updatedAt: 1, publishedAt: 1 })
        .sort({ publishedAt: -1 })
        .toArray()
        .catch(err => {
          console.error('Failed to fetch news for sitemap:', err);
          return [];
        }),

      // Articles (if collection exists)
      getDb()
        .collection<Article>('articles')
        .find({ published: true })
        .project({ slug: 1, updatedAt: 1, publishedAt: 1 })
        .sort({ publishedAt: -1 })
        .toArray()
        .catch(err => {
          console.error('Failed to fetch articles for sitemap:', err);
          return [];
        }),

      // Glossary terms
      getDb()
        .collection<GlossaryTerm>('glossary')
        .find({ published: true })
        .project({ slug: 1, updatedAt: 1 })
        .sort({ term: 1 })
        .toArray()
        .catch(err => {
          console.error('Failed to fetch glossary for sitemap:', err);
          return [];
        }),
    ]);

    // Map news articles to sitemap entries
    const newsEntries: MetadataRoute.Sitemap = newsArticles.map(article => ({
      url: `${SITE_URL}/news/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Map articles to sitemap entries (if any exist)
    const articleEntries: MetadataRoute.Sitemap = articles.map(article => ({
      url: `${SITE_URL}/articles/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Map glossary terms to sitemap entries
    const glossaryEntries: MetadataRoute.Sitemap = glossaryTerms.map(term => ({
      url: `${SITE_URL}/glossary/${term.slug}`,
      lastModified: term.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    // Add index pages for dynamic sections if they have content
    const dynamicIndexPages: MetadataRoute.Sitemap = [];
    
    if (articles.length > 0) {
      dynamicIndexPages.push({
        url: `${SITE_URL}/articles`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    if (glossaryTerms.length > 0) {
      dynamicIndexPages.push({
        url: `${SITE_URL}/glossary`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    // Combine all routes
    return [
      ...staticRoutes,
      ...dynamicIndexPages,
      ...newsEntries,
      ...articleEntries,
      ...glossaryEntries,
    ];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Return at least static routes if DB fails
    return staticRoutes;
  }
}
