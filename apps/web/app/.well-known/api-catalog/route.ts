/**
 * RFC 9727 API Catalog.
 *
 * Machine-readable index of SODAX public APIs and discovery endpoints. Served
 * as `application/linkset+json` so scanners and agents can enumerate everything
 * SODAX exposes without scraping the HTML site.
 *
 * Agent-readiness response rules:
 * - No DB/env reads — the payload is a static literal (API3:2023, LLM02).
 * - `X-Content-Type-Options: nosniff`   (ASVS V14)
 * - `Access-Control-Allow-Origin: *`    (API8:2023 — intentionally public)
 * - `Cache-Control: public, max-age=3600`
 */
export const dynamic = 'force-static';

// URLs are hardcoded to the canonical https://sodax.com origin on purpose — even
// preview/dev deploys point agents at the production resources they'll actually
// reach. Do not swap to an env-based SITE_URL without an explicit decision.
const catalog = {
  linkset: [
    {
      anchor: 'https://sodax.com/',
      'service-desc': [
        {
          href: 'https://sodax.com/.well-known/mcp/server-card.json',
          type: 'application/json',
          title: 'SODAX MCP Server Card',
        },
        {
          href: 'https://sodax.com/.well-known/agent-skills/index.json',
          type: 'application/json',
          title: 'SODAX Agent Skills index',
        },
      ],
      'service-doc': [
        {
          href: 'https://docs.sodax.com',
          type: 'text/html',
          title: 'SODAX developer documentation',
        },
      ],
      alternate: [
        {
          href: 'https://sodax.com/sitemap.xml',
          type: 'application/xml',
          title: 'Sitemap',
        },
        {
          href: 'https://sodax.com/llms.txt',
          type: 'text/plain',
          title: 'llms.txt — curated agent index',
        },
        {
          href: 'https://sodax.com/llms-full.txt',
          type: 'text/plain',
          title: 'llms-full.txt — full-context markdown bundle',
        },
        {
          href: 'https://sodax.com/news/feed.xml',
          type: 'application/rss+xml',
          title: 'News RSS feed',
        },
      ],
      related: [
        {
          href: 'https://api.sodax.com/v1/intent',
          type: 'application/json',
          title: 'SODAX Solver API — cross-chain intent execution',
        },
        {
          href: 'https://builders.sodax.com/mcp',
          type: 'application/json',
          title: 'SODAX Builders MCP — on-chain protocol data + SDK docs',
        },
        {
          href: 'https://marketing.sodax.com/mcp',
          type: 'application/json',
          title: 'SODAX Marketing MCP — brand, glossary, voice & guardrails',
        },
        {
          href: 'https://builders.sodax.com',
          type: 'text/html',
          title: 'SODAX Builders portal — MCP, SDK, tooling',
        },
      ],
    },
  ],
};

export function GET(): Response {
  return new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      'Content-Type': 'application/linkset+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
