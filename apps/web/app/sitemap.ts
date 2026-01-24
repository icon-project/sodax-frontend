import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sodax.com';
const LAST_MODIFIED = new Date('2026-01-19');

export default function sitemap(): MetadataRoute.Sitemap {
  // Static routes that are indexable and public
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/swap`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/save`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/loans`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/migrate`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/discord`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Note: /news and /press redirect to external sites (news.sodax.com, press.sodax.com)
  // These are not included as they are external redirects

  return staticRoutes;
}
