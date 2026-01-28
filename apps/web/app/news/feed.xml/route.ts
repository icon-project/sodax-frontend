import { db } from '@/lib/db';

// Static generation at build time with ISR
// This ensures the RSS feed is cached and not making DB calls on every request
export const revalidate = 300; // Revalidate every 5 minutes (same as news page)

interface NewsArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  categories: string[];
  tags: string[];
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
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
    console.error('Failed to fetch news for RSS:', error);
    return [];
  }
}

export async function GET() {
  try {
    const articles = await getPublishedNews();
    const siteUrl = 'https://sodax.com';
    const buildDate = new Date().toUTCString();

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>SODAX News</title>
    <link>${siteUrl}/news</link>
    <description>Latest updates, product launches, and insights from SODAX - the unified liquidity layer revolutionizing DeFi across 15+ blockchains.</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/news/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/logo.png</url>
      <title>SODAX</title>
      <link>${siteUrl}</link>
    </image>
    <copyright>Copyright ${new Date().getFullYear()} SODAX. All rights reserved.</copyright>
    <category>DeFi</category>
    <category>Blockchain</category>
    <category>Cryptocurrency</category>
${articles
  .map(article => {
    const pubDate = (article.publishedAt || article.createdAt).toUTCString();
    const articleUrl = `${siteUrl}/news/${article.slug}`;
    const imageUrl = article.image || `${siteUrl}/og-news.png`;

    // Clean and escape content
    const description = escapeXml(article.excerpt);
    const contentText = stripHtml(article.content);
    const contentPreview = escapeXml(contentText.substring(0, 500) + (contentText.length > 500 ? '...' : ''));

    return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <description>${description}</description>
      <content:encoded><![CDATA[
        <img src="${imageUrl}" alt="${escapeXml(article.title)}" style="max-width: 100%; height: auto; margin-bottom: 1rem;" />
        <p>${contentPreview}</p>
        <p><a href="${articleUrl}">Read the full article on SODAX</a></p>
      ]]></content:encoded>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>SODAX</dc:creator>
${article.categories.map(cat => `      <category>${escapeXml(cat)}</category>`).join('\n')}
${article.tags.map(tag => `      <category>${escapeXml(tag)}</category>`).join('\n')}
      <enclosure url="${imageUrl}" type="image/png" />
    </item>`;
  })
  .join('\n')}
  </channel>
</rss>`;

    return new Response(rssXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('RSS feed generation error:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
}
