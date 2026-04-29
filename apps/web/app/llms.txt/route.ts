// Dynamic llms.txt sitemap for AI agents (Agent Readiness Phase 2 — issue #1153).
//
// Format: https://llmstxt.org — H1 title + blockquote summary + H2 sections of
// markdown links. Mirrors the structure of apps/web/app/sitemap.ts so news
// articles, glossary concepts, and system pages are picked up automatically
// when CMS / Notion content is published.
//
// Links point to the canonical HTML URL; agents follow the `Link:
// </index.md>; rel="alternate"; type="text/markdown"` header (set by middleware)
// or the `/index.md` URL fallback to fetch the markdown variant. The full
// concatenated markdown bundle is at https://sodax.com/llms-full.txt.
//
// Agent-readiness response rules (docs/agent-readiness.md §2):
// - X-Content-Type-Options: nosniff
// - Access-Control-Allow-Origin: *
// - Cache-Control: public, s-maxage=300, stale-while-revalidate=600
// - Content-Type: text/plain; charset=utf-8 (llms.txt is plain-text per spec)

import { getDb } from '@/lib/db';
import { getNotionPages, slugify } from '@/lib/notion';
import {
  BORROW_ROUTE,
  EXCHANGE_ROUTE,
  GLOSSARY_ROUTE,
  HOLDERS_ROUTE,
  HOME_ROUTE,
  MIGRATE_ROUTE,
  NEWS_ROUTE,
  PARTNERS_ROUTE,
  POOL_ROUTE,
  SAVE_ROUTE,
  SODA_TOKEN_ROUTE,
  STAKE_ROUTE,
  SWAP_ROUTE,
} from '@/constants/routes';

export const dynamic = 'force-static';
export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sodax.com';
const NEWS_LIMIT = 50;

const RESPONSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  'X-Content-Type-Options': 'nosniff',
  'Access-Control-Allow-Origin': '*',
};

interface NewsArticleListing {
  slug: string;
  title: string;
  excerpt?: string;
}

interface CuratedLink {
  path: string;
  title: string;
  summary: string;
}

const CORE_LINKS: CuratedLink[] = [
  { path: HOME_ROUTE, title: 'SODAX', summary: 'Cross-network execution layer for modern money' },
  { path: PARTNERS_ROUTE, title: 'Partners', summary: 'Integration partners and ecosystem' },
  { path: HOLDERS_ROUTE, title: 'Holders', summary: 'SODA token holders, governance, and community resources' },
  { path: SODA_TOKEN_ROUTE, title: 'SODA Token', summary: 'SODA token economics, supply, and distribution' },
  { path: '/discord', title: 'Discord', summary: 'SODAX community on Discord (redirects to invite)' },
  { path: '/press', title: 'Press', summary: 'Press kit, media resources, and brand assets' },
];

const EXCHANGE_LINKS: CuratedLink[] = [
  { path: EXCHANGE_ROUTE, title: 'SODAX Exchange', summary: 'Unified swap, save, borrow, stake, pool, and migrate' },
  { path: SWAP_ROUTE, title: 'Swap', summary: 'Cross-network swaps via the SODAX solver' },
  { path: SAVE_ROUTE, title: 'Save', summary: 'Earn yield by supplying assets to the money market' },
  { path: BORROW_ROUTE, title: 'Borrow', summary: 'Borrow against supplied collateral' },
  { path: STAKE_ROUTE, title: 'Stake', summary: 'Stake SODA to participate in network coordination' },
  { path: POOL_ROUTE, title: 'Pools', summary: 'AMM pools and liquidity provision' },
  { path: MIGRATE_ROUTE, title: 'Migrate', summary: 'Migrate legacy tokens and positions into SODAX' },
];

const PARTNER_LINKS: CuratedLink[] = [
  { path: '/partners/amped-finance', title: 'Amped Finance', summary: 'Perpetuals partner integration' },
  { path: '/partners/hana', title: 'Hana Wallet', summary: 'Multi-chain wallet partner integration' },
  { path: '/partners/lightlink-network', title: 'LightLink Network', summary: 'L2 network partner integration' },
  { path: '/partners/sodax-sdk', title: 'SODAX SDK', summary: 'Builder integration via the SODAX SDK' },
];

function renderLink({ path, title, summary }: CuratedLink): string {
  return `- [${title}](${SITE_URL}${path}): ${summary}`;
}

async function fetchNewsListings(): Promise<NewsArticleListing[]> {
  try {
    const articles = await getDb()
      .collection<NewsArticleListing & { published: boolean }>('news')
      .find({ published: true }, { projection: { slug: 1, title: 1, excerpt: 1 } })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(NEWS_LIMIT)
      .toArray();
    return articles;
  } catch (error) {
    console.error('llms.txt: failed to fetch news listings', error);
    return [];
  }
}

async function fetchValidatedNotionTitles(
  db: 'concepts' | 'system',
): Promise<Array<{ title: string; summary: string }>> {
  try {
    const pages = await getNotionPages(db);
    return pages
      .filter(page => page.properties?.Validated?.checkbox === true)
      .map(page => {
        const title = page.properties.Title.title[0]?.plain_text ?? '';
        const summary = page.properties['One-sentency summary']?.rich_text?.[0]?.plain_text ?? '';
        return { title, summary };
      })
      .filter(entry => entry.title.length > 0);
  } catch (error) {
    console.error(`llms.txt: failed to fetch Notion ${db}`, error);
    return [];
  }
}

export async function GET(): Promise<Response> {
  const [newsListings, conceptEntries, systemEntries] = await Promise.all([
    fetchNewsListings(),
    fetchValidatedNotionTitles('concepts'),
    fetchValidatedNotionTitles('system'),
  ]);

  const lines: string[] = [];
  lines.push('# SODAX');
  lines.push('');
  lines.push(
    '> SODAX is the cross-network execution layer for modern money — infrastructure that lets users swap, lend, borrow, stake, and bridge across any supported blockchain network as a single financial system.',
  );
  lines.push('');
  lines.push(
    'This file lists canonical SODAX pages for AI agents. Markdown variants are available via `Accept: text/markdown` or by appending `/index.md` to any URL below. The full concatenated markdown bundle is at `/llms-full.txt`.',
  );
  lines.push('');

  lines.push('## Core');
  lines.push('');
  for (const link of CORE_LINKS) lines.push(renderLink(link));
  lines.push('');

  lines.push('## Exchange');
  lines.push('');
  for (const link of EXCHANGE_LINKS) lines.push(renderLink(link));
  lines.push('');

  lines.push('## Partner Integrations');
  lines.push('');
  for (const link of PARTNER_LINKS) lines.push(renderLink(link));
  lines.push('');

  lines.push('## News');
  lines.push('');
  if (newsListings.length === 0) {
    lines.push('_No published articles available._');
  } else {
    lines.push(`- [News index](${SITE_URL}${NEWS_ROUTE}): All published articles, partnerships, and product updates`);
    for (const article of newsListings) {
      const summary = article.excerpt ? `: ${article.excerpt}` : '';
      lines.push(`- [${article.title}](${SITE_URL}${NEWS_ROUTE}/${article.slug})${summary}`);
    }
  }
  lines.push('');

  // Glossary section is always emitted: /glossary, /concepts, /system are
  // explicit ticket-required index pages (issue #1153 §2). Per-entry concept
  // and system links are appended when Notion returns validated entries.
  lines.push('## Glossary');
  lines.push('');
  lines.push(`- [Glossary index](${SITE_URL}${GLOSSARY_ROUTE}): Definitions of key SODAX concepts and components`);
  lines.push(`- [Concepts](${SITE_URL}/concepts): SODAX system concepts and economic primitives`);
  lines.push(`- [System Components](${SITE_URL}/system): Architectural components of the SODAX system`);
  for (const entry of conceptEntries) {
    const summary = entry.summary ? `: ${entry.summary}` : '';
    lines.push(`- [${entry.title}](${SITE_URL}/concepts/${slugify(entry.title)})${summary}`);
  }
  for (const entry of systemEntries) {
    const summary = entry.summary ? `: ${entry.summary}` : '';
    lines.push(`- [${entry.title}](${SITE_URL}/system/${slugify(entry.title)})${summary}`);
  }
  lines.push('');

  lines.push('## Developer Resources');
  lines.push('');
  lines.push('- [Developer Docs](https://docs.sodax.com): SODAX SDK, packages, and integration guides');
  lines.push('- [Builders MCP](https://builders.sodax.com/mcp): Public MCP server with on-chain data and SDK docs');
  lines.push('- [Marketing MCP](https://marketing.sodax.com/mcp): Brand, glossary, and editorial source of truth');
  lines.push('');

  lines.push('## Optional');
  lines.push('');
  lines.push(`- [llms-full.txt](${SITE_URL}/llms-full.txt): Concatenated markdown of all curated pages`);
  lines.push(`- [Sitemap (XML)](${SITE_URL}/sitemap.xml): Complete URL list for crawlers`);
  lines.push(`- [News RSS feed](${SITE_URL}/news/feed.xml): Subscribe to news updates`);
  lines.push(`- [Robots / Content-Signal](${SITE_URL}/robots.txt): Crawl rules and AI-train policy`);
  lines.push(`- [API Catalog](${SITE_URL}/.well-known/api-catalog): Machine-readable API discovery`);
  lines.push(`- [MCP Server Card](${SITE_URL}/.well-known/mcp/server-card.json): MCP servers and tools`);
  lines.push(`- [Agent Skills Index](${SITE_URL}/.well-known/agent-skills/index.json): Available agent skills`);

  return new Response(`${lines.join('\n')}\n`, { headers: RESPONSE_HEADERS });
}
