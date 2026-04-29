/**
 * MCP Server Card — advertises SODAX's public MCP servers to agent clients.
 *
 * Only MCPs that are publicly reachable without OAuth are listed. System Monitor,
 * X-Research, Google Analytics, and YouTube Analysis MCPs are OAuth-gated and
 * intentionally omitted (Agentic AI: Identity Spoofing — don't advertise what
 * clients can't actually reach; avoids leaking existence of internal tooling).
 *
 * Builders MCP proxies docs.sodax.com, so a separate docs MCP is not needed.
 *
 * Agent-readiness response rules:
 * - Static literal payload (API3:2023, LLM02)
 * - `X-Content-Type-Options: nosniff`  (ASVS V14)
 * - `Access-Control-Allow-Origin: *`   (API8:2023)
 * - `Cache-Control: public, max-age=3600`
 */
export const dynamic = 'force-static';

// URLs are hardcoded to the canonical https://sodax.com / https://builders.sodax.com /
// https://marketing.sodax.com origins on purpose — even preview/dev deploys point
// agents at the production resources they'll actually reach. Do not swap to an
// env-based SITE_URL without an explicit decision.
const serverCard = {
  // Top-level identity fields — required by SEP-2127 conformance scanners
  // (e.g. isitagentready.com checks for `name` or `serverInfo.name`). Without
  // these, the card is rejected as missing required MCP fields even though
  // the per-server `servers[].name` entries are populated below.
  name: 'SODAX MCP Catalog',
  // Primary MCP endpoint at the top level so agents reading only the card
  // header are pointed straight at https://builders.sodax.com/mcp instead of
  // resolving the catalog and walking `servers[]`. Builders is the canonical
  // public MCP for SODAX (on-chain data + auto-proxied SDK docs); marketing
  // is a sibling resource exposed via `servers[]`.
  url: 'https://builders.sodax.com/mcp',
  serverInfo: {
    name: 'SODAX MCP Catalog',
    url: 'https://builders.sodax.com/mcp',
    version: '0.1',
  },
  version: '0.1',
  // KEEP IN SYNC: bump this date whenever any server entry, URL, or tool list
  // below changes. It is the only freshness signal agents have — drift here
  // silently turns this card into a Deceptive Tool Description (Agentic AI T12).
  updatedAt: '2026-04-29',
  servers: [
    {
      id: 'sodax-builders',
      name: 'SODAX Builders MCP',
      description:
        'On-chain protocol data for SODAX: supported chains, swap tokens, transaction lookups, trading volume, money market positions, lending assets, partner integrations, SODA token supply, and SDK documentation (auto-proxied from docs.sodax.com).',
      url: 'https://builders.sodax.com/mcp',
      transport: 'http',
      auth: { type: 'none' },
      capabilities: ['tools'],
      // Tool list mirrors the live MCP `tools/list` response as of 2026-04-21.
      // When tools are added/renamed on the server, re-run `npx @modelcontextprotocol/inspector
      // https://builders.sodax.com/mcp`, click List Tools, and sync this array.
      tools: [
        {
          name: 'sodax_get_supported_chains',
          description: 'List all blockchain networks supported by SODAX for cross-chain swaps and DeFi operations.',
        },
        {
          name: 'sodax_get_swap_tokens',
          description: 'Get available tokens for swapping on SODAX, optionally filtered by chain.',
        },
        { name: 'sodax_get_transaction', description: 'Look up a specific transaction by its hash.' },
        {
          name: 'sodax_get_user_transactions',
          description: 'Get intent/transaction history for a specific wallet address.',
        },
        { name: 'sodax_get_volume', description: 'Solver volume data with filtering and pagination.' },
        { name: 'sodax_get_orderbook', description: 'Current orderbook entries showing pending/open intents.' },
        {
          name: 'sodax_get_money_market_assets',
          description: 'All assets available for lending and borrowing on the SODAX money market.',
        },
        {
          name: 'sodax_get_money_market_asset',
          description: 'Detailed information for a specific money market asset.',
        },
        {
          name: 'sodax_get_money_market_tokens',
          description: 'Tokens supported for money market lending/borrowing, optionally filtered by chain.',
        },
        {
          name: 'sodax_get_money_market_reserve_assets',
          description: 'Money market reserve assets used as collateral backing.',
        },
        {
          name: 'sodax_get_user_position',
          description: "A user's lending and borrowing position in the money market.",
        },
        { name: 'sodax_get_asset_suppliers', description: 'Suppliers (lenders) for a specific money market asset.' },
        { name: 'sodax_get_asset_borrowers', description: 'Borrowers for a specific money market asset.' },
        {
          name: 'sodax_get_all_borrowers',
          description: 'All borrowers across all money market assets with pagination.',
        },
        {
          name: 'sodax_get_amm_positions',
          description: 'AMM liquidity-provider NFT positions, optionally filtered by owner.',
        },
        { name: 'sodax_get_amm_pool_candles', description: 'OHLCV candlestick chart data for an AMM pool.' },
        { name: 'sodax_get_intent', description: 'Look up a specific intent by its intent hash.' },
        { name: 'sodax_get_solver_intent', description: 'Solver-side details for an intent including fill history.' },
        {
          name: 'sodax_get_partners',
          description: 'SODAX integration partners including wallets, DEXs, and other protocols.',
        },
        {
          name: 'sodax_get_partner_summary',
          description: 'Volume and activity summary for a specific integration partner.',
        },
        { name: 'sodax_get_token_supply', description: 'SODA token supply information (total, circulating, burned).' },
        { name: 'sodax_get_total_supply', description: 'SODA token total supply as a plain number.' },
        { name: 'sodax_get_circulating_supply', description: 'SODA token circulating supply as a plain number.' },
        {
          name: 'sodax_get_all_config',
          description: 'Full SODAX configuration (chains, tokens, protocol settings) in one call.',
        },
        {
          name: 'sodax_get_all_chains_configs',
          description: 'Detailed configuration for all spoke chains (contracts, RPCs, tokens).',
        },
        { name: 'sodax_get_relay_chain_id_map', description: 'Mapping between chain IDs and intent relay chain IDs.' },
        { name: 'sodax_get_hub_assets', description: 'Assets representing spoke tokens on the hub (Sonic) chain.' },
        { name: 'sodax_refresh_cache', description: 'Clear cached API data to force fresh fetches.' },
        { name: 'docs_searchDocumentation', description: 'Full-text search across docs.sodax.com.' },
        { name: 'docs_getPage', description: 'Fetch the full markdown content of a specific documentation page.' },
        { name: 'docs_list_tools', description: 'List all SDK documentation tools with their parameters.' },
        { name: 'docs_health', description: 'Check SDK documentation availability.' },
        { name: 'docs_refresh', description: 'Reconnect to SDK documentation and refresh available tools.' },
      ],
      documentation: 'https://builders.sodax.com',
    },
    {
      id: 'sodax-marketing',
      name: 'SODAX Marketing MCP',
      description:
        'Brand, voice, and editorial source of truth for SODAX: boilerplate copy, brand assets (colors, typography, logos), glossary terms, integration profiles, news feed, and voice guardrails. Use this MCP when generating any marketing-facing copy about SODAX to ensure terminology and positioning stay accurate.',
      url: 'https://marketing.sodax.com/mcp',
      transport: 'http',
      auth: { type: 'none' },
      capabilities: ['tools'],
      // Tool list mirrors the live MCP `tools/list` response as of 2026-04-21.
      // When tools are added/renamed on the server, re-run `npx @modelcontextprotocol/inspector
      // https://marketing.sodax.com/mcp`, click List Tools, and sync this array.
      tools: [
        {
          name: 'sodax_get_voice_guardrails',
          description:
            'Voice & Guardrails — terminology rules, allowed claims, voice principles, and common mistakes to avoid. Check before publishing any SODAX content.',
        },
        { name: 'sodax_refresh_voice_guardrails', description: 'Force a refresh of Voice & Guardrails from Notion.' },
        {
          name: 'sodax_get_brand_assets_overview',
          description: 'Overview of the SODAX visual identity system (colors, logos, typography, usage guidelines).',
        },
        {
          name: 'sodax_get_brand_colors',
          description: 'Official SODAX color palette with hex codes. Filterable by group (primary/secondary/neutral).',
        },
        { name: 'sodax_get_typography', description: 'Official SODAX typography specs (Inter + Shrikhand).' },
        { name: 'sodax_get_logos', description: 'All SODAX logo variants with SVG + PNG download links.' },
        {
          name: 'sodax_get_usage_guidelines',
          description: 'SODAX visual identity usage rules and implementation standards.',
        },
        { name: 'sodax_refresh_brand_assets', description: 'Force refresh brand assets from Notion.' },
        {
          name: 'sodax_get_glossary_overview',
          description: 'Overview of the SODAX Technical Glossary (System Concepts + System Components).',
        },
        { name: 'sodax_list_glossary_terms', description: 'List all glossary terms. Filterable by category.' },
        { name: 'sodax_get_glossary_term', description: 'Look up the canonical definition of a specific SODAX term.' },
        { name: 'sodax_search_glossary', description: 'Search the glossary by keyword, concept, or tag.' },
        {
          name: 'sodax_translate_term',
          description: 'Translate a SODAX technical term into simple language for non-technical audiences.',
        },
        { name: 'sodax_get_terms_by_tag', description: 'Find all glossary terms with a specific tag.' },
        { name: 'sodax_refresh_glossary', description: 'Force refresh the glossary from Notion.' },
        {
          name: 'sodax_get_stats_overview',
          description: 'High-level snapshot of SODAX live metrics (networks, partners, token, activity).',
        },
        { name: 'sodax_get_networks', description: 'Full list of blockchain networks integrated with SODAX.' },
        { name: 'sodax_get_partners', description: 'List of protocols and applications that have integrated SODAX.' },
        {
          name: 'sodax_get_token_supply',
          description: 'SODA token economics: total, circulating, locked supply and DAO fund balance.',
        },
        { name: 'sodax_get_money_market_assets', description: 'Money market assets with supply/borrow data.' },
        { name: 'sodax_refresh_stats', description: 'Force refresh live stats from the SODAX API.' },
        {
          name: 'sodax_get_integration_profiles_overview',
          description:
            'Overview of all SODAX integration profiles (DEXs, wallets, lending, solver marketplaces, networks).',
        },
        {
          name: 'sodax_list_integration_profiles',
          description: 'List integration profiles with categories, examples, and previews.',
        },
        {
          name: 'sodax_get_integration_profile',
          description:
            'Full positioning profile for an integration type (pitch angles, proof points, objection handling, messaging).',
        },
        { name: 'sodax_search_integration_profiles', description: 'Search integration profiles by keyword.' },
        { name: 'sodax_refresh_integration_profiles', description: 'Force refresh integration profiles from Notion.' },
        {
          name: 'sodax_get_sitemap',
          description:
            'All canonical SODAX page URLs from the official sitemap. Use to verify URLs and avoid impostor domains.',
        },
        { name: 'sodax_search_sitemap', description: 'Search the sitemap by keyword for canonical URLs.' },
        { name: 'sodax_refresh_sitemap', description: 'Force-refresh the cached sitemap from sodax.com.' },
        { name: 'sodax_get_latest_news', description: 'Most recent SODAX news articles and announcements.' },
        { name: 'sodax_search_news', description: 'Search SODAX news by keyword.' },
        { name: 'sodax_get_news_feed', description: 'Complete SODAX news feed.' },
        { name: 'sodax_refresh_news_feed', description: 'Force-refresh the cached news feed.' },
        {
          name: 'sodax_get_boilerplate',
          description:
            'Pre-approved SODAX boilerplate copy. Variants: one-liner, social-bio, short, medium, long/press-kit, developer, user-facing, partner-template.',
        },
        {
          name: 'sodax_list_boilerplates',
          description: 'List boilerplate variants with audience and length metadata.',
        },
        { name: 'sodax_refresh_boilerplate', description: 'Force a refresh of boilerplate descriptions from Notion.' },
      ],
      documentation: 'https://marketing.sodax.com',
    },
  ],
  related: {
    apiCatalog: 'https://sodax.com/.well-known/api-catalog',
    agentSkills: 'https://sodax.com/.well-known/agent-skills/index.json',
    llmsTxt: 'https://sodax.com/llms.txt',
    llmsFullTxt: 'https://sodax.com/llms-full.txt',
  },
};

export function GET(): Response {
  return new Response(JSON.stringify(serverCard, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
