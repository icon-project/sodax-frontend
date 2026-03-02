import type { MetadataRoute } from 'next';
import {
  COMMUNITY_ROUTE,
  DISCORD_PAGE_ROUTE,
  GLOSSARY_ROUTE,
  LOANS_ROUTE,
  MIGRATE_ROUTE,
  NEWS_ROUTE,
  PARTNERS_ROUTE,
  SAVE_ROUTE,
  SWAP_ROUTE,
} from '@/constants/routes';
import { getDb } from '@/lib/db';
import { getNotionPages, slugify } from '@/lib/notion';

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes that are indexable and public (use route constants for single source of truth)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}${SWAP_ROUTE}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}${SAVE_ROUTE}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}${LOANS_ROUTE}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}${MIGRATE_ROUTE}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}${DISCORD_PAGE_ROUTE}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}${NEWS_ROUTE}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}${COMMUNITY_ROUTE}/soda-token`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}${PARTNERS_ROUTE}/amped-finance`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}${PARTNERS_ROUTE}/hana`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}${PARTNERS_ROUTE}/lightlink-network`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}${PARTNERS_ROUTE}/sodax-sdk`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  try {
    // Fetch dynamic content from CMS and Notion in parallel
    const [newsArticles, articles, conceptPages, systemPages] = await Promise.all([
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

      // Glossary concepts from Notion
      getNotionPages('concepts').catch(err => {
        console.error('Failed to fetch concepts for sitemap:', err);
        return [];
      }),

      // Glossary system components from Notion
      getNotionPages('system').catch(err => {
        console.error('Failed to fetch system pages for sitemap:', err);
        return [];
      }),
    ]);

    // Map news articles to sitemap entries
    const newsEntries: MetadataRoute.Sitemap = newsArticles.map(article => ({
      url: `${SITE_URL}${NEWS_ROUTE}/${article.slug}`,
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

    // Map glossary concept pages to sitemap entries
    const conceptEntries: MetadataRoute.Sitemap = conceptPages
      .filter(p => p.properties?.Validated?.checkbox === true)
      .filter(p => p.properties?.Title?.title?.[0]?.plain_text)
      .map(page => {
        const title = page.properties.Title.title[0]?.plain_text || '';
        return {
          url: `${SITE_URL}/concepts/${slugify(title)}`,
          lastModified: new Date(page.last_edited_time),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        };
      });

    // Map glossary system pages to sitemap entries
    const systemEntries: MetadataRoute.Sitemap = systemPages
      .filter(p => p.properties?.Validated?.checkbox === true)
      .filter(p => p.properties?.Title?.title?.[0]?.plain_text)
      .map(page => {
        const title = page.properties.Title.title[0]?.plain_text || '';
        return {
          url: `${SITE_URL}/system/${slugify(title)}`,
          lastModified: new Date(page.last_edited_time),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        };
      });

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

    const glossaryEntries = [...conceptEntries, ...systemEntries];

    if (glossaryEntries.length > 0) {
      dynamicIndexPages.push({
        url: `${SITE_URL}${GLOSSARY_ROUTE}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    // Combine all routes
    return [...staticRoutes, ...dynamicIndexPages, ...newsEntries, ...articleEntries, ...glossaryEntries];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Return at least static routes if DB fails
    return staticRoutes;
  }
}
