/**
 * Agent Skills index — declares public capabilities agents can invoke against SODAX.
 *
 * Scope locked with David: three read/inform skills only (swap, money-market, bridge).
 * Staking, migration, partner fees, and DEX are deferred — listing them implies
 * the agent can take action there, which requires an authenticated surface that
 * doesn't exist yet (LLM06: Excessive Agency).
 *
 * Each skill points at the canonical HTML UI, the SDK module, the docs page, and
 * relevant Builders MCP tools — so an agent can decide whether to read/observe
 * via the MCP or drive the UI via the SDK.
 *
 * Agent-readiness response rules:
 * - Static literal (API3:2023, LLM02)
 * - `X-Content-Type-Options: nosniff`   (ASVS V14)
 * - `Access-Control-Allow-Origin: *`    (API8:2023)
 * - `Cache-Control: public, max-age=3600`
 */
export const dynamic = 'force-static';

// URLs are hardcoded to the canonical https://sodax.com / https://docs.sodax.com
// origins on purpose — even preview/dev deploys point agents at the production
// resources they'll actually reach. Do not swap to an env-based SITE_URL without
// an explicit decision.
const agentSkills = {
  version: '0.1',
  // KEEP IN SYNC: bump this date whenever any skill entry, UI URL, SDK
  // module reference, or docs URL below changes.
  updatedAt: '2026-04-21',
  skills: [
    {
      id: 'swap',
      name: 'Cross-chain swap',
      description:
        'Quote and execute cross-chain swaps via the SODAX Solver network. Sonic is the hub; routes span EVM chains, Solana, Sui, Stellar, Injective, and ICON.',
      capability: 'read+execute',
      ui: 'https://sodax.com/exchange/swap',
      sdk: {
        package: '@sodax/sdk',
        module: 'swap',
        entrypoints: ['SwapService', 'SolverApiService', 'EvmSolverService'],
      },
      docs: 'https://docs.sodax.com/developers/packages/foundation/sdk/functional-modules/swaps',
      mcpTools: ['sodax_get_swap_tokens', 'sodax_get_intent', 'sodax_get_solver_intent'],
    },
    {
      id: 'money-market',
      name: 'Money market (lend & borrow)',
      description:
        'Supply and borrow assets on the SODAX money market. Supports per-asset rate lookup, reserve data, and per-user position inspection.',
      capability: 'read+execute',
      ui: 'https://sodax.com/exchange/loans',
      sdk: {
        package: '@sodax/sdk',
        module: 'moneyMarket',
        entrypoints: [
          'MoneyMarketService',
          'MoneyMarketDataService',
          'LendingPoolService',
          'UiPoolDataProviderService',
        ],
      },
      docs: 'https://docs.sodax.com/developers/packages/foundation/sdk/functional-modules/money_market',
      mcpTools: [
        'sodax_get_money_market_assets',
        'sodax_get_money_market_asset',
        'sodax_get_asset_suppliers',
        'sodax_get_asset_borrowers',
        'sodax_get_user_position',
      ],
    },
    {
      id: 'bridge',
      name: 'Cross-chain bridge',
      description:
        'Move assets across supported chains via SODAX bridging. In the UI, bridge flows are initiated from the same Exchange > Swap screen as cross-chain swaps — when the input and output chains differ, the Solver executes it as a bridge transfer. No separate /exchange/bridge route exists; the SDK `bridge` module is the distinct surface.',
      capability: 'read+execute',
      ui: 'https://sodax.com/exchange/swap',
      uiNote: 'Shared with the swap skill. Select different input and output chains to trigger a bridge flow.',
      sdk: {
        package: '@sodax/sdk',
        module: 'bridge',
        entrypoints: ['BridgeService'],
      },
      docs: 'https://docs.sodax.com/developers/packages/foundation/sdk/functional-modules/bridge',
      mcpTools: ['sodax_get_supported_chains', 'sodax_get_swap_tokens'],
    },
  ],
  related: {
    mcpServerCard: 'https://sodax.com/.well-known/mcp/server-card.json',
    apiCatalog: 'https://sodax.com/.well-known/api-catalog',
    llmsTxt: 'https://sodax.com/llms.txt',
  },
};

export function GET(): Response {
  return new Response(JSON.stringify(agentSkills, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
