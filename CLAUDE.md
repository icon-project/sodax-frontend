# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sodax is a cross-chain DeFi platform supporting swaps, lending (money market), staking, bridging, and token migration across multiple blockchains (EVM chains, Solana, Sui, Stellar, Injective, ICON). The hub chain is Sonic.

## Monorepo Structure

Turborepo + pnpm workspace. Package manager: **pnpm 9.8.0**.

- `apps/web` — Main Next.js 15 web app (App Router, React 19, Tailwind CSS, shadcn/ui)
- `apps/demo` — Vite + React demo app for SDK showcase
- `apps/node` — Node.js scripts for E2E testing various chain operations
- `packages/types` — Shared TypeScript type definitions (chain IDs, common types, backend types)
- `packages/sdk` — Core SDK: swap, bridge, moneyMarket, staking, migration, partner modules
- `packages/wallet-sdk-core` — Low-level multi-chain wallet operations (signing, broadcasting)
- `packages/wallet-sdk-react` — React hooks/providers wrapping wallet-sdk-core (Zustand state, EIP-6963)
- `packages/dapp-kit` — High-level React hooks combining SDK + wallet-sdk + React Query
- `packages/typescript-config` — Shared tsconfig base files

### Package dependency chain

`types` → `sdk` → `wallet-sdk-core` → `wallet-sdk-react` → `dapp-kit` → `apps/web`

## Common Commands

```bash
pnpm i                    # Install dependencies
pnpm dev:web              # Run web app dev server (Next.js on port 3001 with Turbopack)
pnpm dev:demo             # Run demo app dev server
pnpm build                # Build everything (packages must build before apps)
pnpm build:packages       # Build only SDK packages
pnpm lint                 # Lint with Biome (auto-fixes)
pnpm pretty               # Format with Biome (auto-fixes)
pnpm checkTs              # TypeScript type checking across all packages
pnpm test                 # Run tests across all packages
pnpm clean                # Remove all node_modules, dist, .turbo, .next
```

## Common Pitfalls

- **Only change code directly related to the task at hand.** Do not refactor, restyle, rename, or "improve" surrounding code that is not part of the requested changes. Unrelated modifications risk breaking existing behavior (e.g., removing hover effects, animations, or styles that were intentionally designed). If you notice something that could be improved but is outside the scope of the request, mention it to the user instead of changing it.
- **Never use `bigint` in types that will be passed to `JSON.stringify`** — it throws `TypeError` at runtime. Use `string` for numeric fields in API request/response types. If `bigint` is needed in domain types, convert to string before serialization.
- **Always use standard Tailwind utility classes instead of arbitrary pixel values** when an equivalent exists. Examples: `text-sm` not `text-[14px]`, `text-base` not `text-[16px]`, `h-4` not `h-[16px]`, `size-4` not `size-[16px]`. Only use arbitrary values (e.g. `min-w-[204px]`, `leading-[1.4]`) when no standard utility matches. Font families use arbitrary values (`font-[InterRegular]`, `font-[InterBold]`) — this is the project convention since fonts are registered as CSS custom properties in `globals.css`.
- **Never instantiate SDK clients (Resend, etc.) at module level in API routes** — env vars aren't available during Next.js build-time static page collection. Always create instances inside the handler or a called function.
- **Environment variables used only at runtime** (API keys, secrets) must NOT be prefixed with `NEXT_PUBLIC_`. Only prefix env vars that need to be exposed to the browser.
- **API routes must handle errors gracefully** — always return a JSON response with an appropriate status code, never let exceptions bubble up as 500 with no body.
- **Webhook endpoints must always return 200** — external services (Resend, etc.) retry on non-2xx responses. A misconfigured secret or bad payload should be logged, not cause an infinite retry storm.
- **Agent-facing endpoints** (`/.well-known/*`, `/__agent/*`, `llms*.txt`, MCP servers): follow the SODAX Agent-Readiness Guardrails in [docs/agent-readiness.md](docs/agent-readiness.md). OWASP-aligned: static payloads, required response headers, no header interpolation, no self-fetching, Content-Signal `ai-train=no`.
- **When adding a new public page** under `apps/web/app/` that humans can visit, also add agent-readable markdown so AI agents can discover it. Three sync points (closed allowlists — keep them in lockstep): (1) write a concise markdown file under `apps/web/content/md/<route>.md` translating the existing approved page copy (H1 + value prop, H2 sections, key facts as bullets, no CTAs/visual elements); (2) register the path in `STATIC_FILE_MAP` in [apps/web/app/agent/md/route.ts](apps/web/app/agent/md/route.ts) so `Accept: text/markdown` and `/index.md` URL fallback work; (3) add it to `CURATED_PAGES` in [apps/web/app/llms-full.txt/route.ts](apps/web/app/llms-full.txt/route.ts) so it's bundled in the full-context file. Optionally add to the relevant link group in [apps/web/app/llms.txt/route.ts](apps/web/app/llms.txt/route.ts) (`CORE_LINKS` / `EXCHANGE_LINKS` / `PARTNER_LINKS`) and to [apps/web/app/sitemap.ts](apps/web/app/sitemap.ts) for crawler discovery. Skip this for admin/auth-gated routes (`/cms/*`, `/partner-dashboard`), time-bound event landing pages, and dynamic content already handled by the Notion/Mongo handlers in `agent/md/route.ts`.


### Running tests for a specific package

```bash
cd packages/sdk && pnpm test          # Unit tests (excludes e2e)
cd packages/sdk && pnpm test-e2e      # E2E tests only
cd packages/sdk && pnpm coverage      # Coverage report
```

To run a single test file with Vitest:
```bash
cd packages/sdk && npx vitest run path/to/test.test.ts
```

## Code Style & Linting

**Biome** is the sole linter/formatter (no ESLint/Prettier). Config is in root `biome.json`.

Key rules enforced:
- No `any` types (`noExplicitAny: error`, `noImplicitAnyLet: error`)
- No non-null assertions (`noNonNullAssertion: error`)
- Use template literals over string concatenation (`useTemplate: error`)
- Use `import type` for type-only imports (`useImportType: warn`)
- Use `node:` prefix for Node.js builtins (`useNodejsImportProtocol: error`)
- No inferrable types (`noInferrableTypes: error`)

Formatting: 2-space indent, 120 char line width, single quotes, semicolons required, trailing commas, LF line endings.

Pre-commit hooks (via Husky + lint-staged) auto-format and lint staged files. Commits must follow **conventional commits** format (enforced by commitlint).

### Naming & Clean Code

Write code that reads like well-written prose. Every name should tell the reader **what** it holds and **why** it exists — without needing a comment or surrounding context to understand it.

**Names must reveal intent — no single-letter or vague variables:**
- `const normalizedSymbol = symbol.toLowerCase()` not `const s = symbol.toLowerCase()`
- `const openDelayId = setTimeout(...)` not `const t = setTimeout(...)`
- `const referenceRect = reference.getBoundingClientRect()` not `const r = reference.getBoundingClientRect()`
- `const priceAtCursor = yScale.invert(...)` not `const p = yScale.invert(...)`
- `leadMagnetResponse` / `newsArticles` not `res` / `data` for fetch results — name what the data *is*, not that it's data

**No magic values — extract to named constants:**
- `const FEEDBACK_CLEAR_DELAY_MS = 3000` not a bare `3000` in `setTimeout`
- `const PRICE_FETCH_TIMEOUT_MS = 30_000` not `setTimeout(() => controller.abort(), 30000)`
- `const ONE_HOUR_MS = 60 * 60 * 1000` not inline `60 * 60 * 1000` in time calculations

**One word, one concept — be consistent across the codebase:**
- Data-fetching functions in `lib/`: prefix with `get` (`getAssetUsdPrice`, `getNewsArticles`)
- React Query hook wrappers in `hooks/`: prefix with `use` (`useStakeVaultApy`, `useDexPositions`)
- Event handlers in components: prefix with `handle` (`handleSubmit`, `handleConnect`)
- Don't mix `fetch`/`get`/`retrieve`/`load` for the same pattern

**Types = nouns, functions = verbs, hooks = `use` prefix:**
- Types/interfaces: `SwapRoute`, `LendingPosition`, `StakeVaultApy`
- Functions: `calculateFee`, `submitTransaction`, `normalizeSymbol`
- Hooks: `useChainBalances`, `useTokenPrice`

**Self-documenting over comments.** If a function needs a comment to explain what it does, rename the function. Add JSDoc only for non-obvious behavior: side effects, error semantics, expected units/formats. Never let comments drift from code (e.g., `// 10 second timeout` on a 30-second timeout).

## Architecture Notes

### Web App (`apps/web`)

- **Routing**: Next.js App Router. Feature routes under `app/(apps)/` (swap, loans, save, stake, migrate, partner).
- **State**: Zustand stores in `stores/` (app-store for chain/page state, modal-store for modals). Server state via `@tanstack/react-query`.
- **Provider stack** (in `providers/providers.tsx`): `SodaxProvider` → `QueryClientProvider` → `SodaxWalletProvider`
- **UI**: shadcn/ui components (Radix UI) in `components/ui/`, shared components in `components/shared/`
- **Hooks**: Cross-route hooks live in `hooks/` (chain balances, token prices, APY, etc.). Route-scoped hooks live in the route's `_hooks/` folder (e.g. `app/(apps)/pool/_hooks/`). Route-scoped constants live in `_constants/`. The leading underscore is Next.js's private-folder convention — it opts out of routing.
- **CMS**: TipTap editor, Notion integration, MongoDB backend in `lib/`
- **SEO / link previews**: Per-page OpenGraph + Twitter card metadata. Three patterns:
  - **Static preview** (default — e.g. `consensus-miami`, `partners/*`, `holders`): `export const metadata: Metadata` from the route's `page.tsx`. Place the image in `apps/web/public/` named `link-preview-<page>.png` (1200×630). Reference it as `/link-preview-<page>.png` in `openGraph.images` and `twitter.images`. Always include `alternates.canonical`, `openGraph` (title/description/type/url/siteName/images), and `twitter` (card: 'summary_large_image', site/creator: '@gosodax').
  - **Dynamic preview** (e.g. `news/[slug]`, `concepts/[slug]`, `system/[slug]`): use Next's `opengraph-image.tsx` + `twitter-image.tsx` file convention with `ImageResponse` from `next/og`.
  - **Separate `layout.tsx`** only when the route also needs JSON-LD structured data (e.g. `community/soda-token`). Don't create a layout just to hold metadata — `page.tsx` accepts a `metadata` export.

### SDK Packages

- Built with **tsup** (dual ESM `.mjs` / CJS `.cjs` output)
- Target Node 18+, also runs in browser
- SDK modules: `swap`, `bridge`, `moneyMarket`, `staking`, `migration`, `partner`, `backendApi`
- Contract ABIs in `packages/sdk/src/shared/abis/`
- Tests use **Vitest**

### Multi-chain wallet architecture

`wallet-sdk-core` provides per-chain implementations in `src/chains/` (EVM, Solana, Sui, Stellar, Injective, ICON). `wallet-sdk-react` wraps these with React hooks (`useXConnect`, `useXAccount`, etc.) and Zustand state in `src/core/`. The `dapp-kit` adds React Query-powered hooks organized by feature (`hooks/swap/`, `hooks/mm/`, `hooks/bridge/`, etc.).

## CI Pipeline

GitHub Actions runs on push to `main`/`development` and all PRs:
1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm build:packages`
4. `pnpm checkTs`
5. `pnpm build`

Tested against Node.js 18.x, 20.x, 22.x.

## Git Flow

Branches: `main` (dev) → `staging` → `production`
- Main: https://sodax-web-dev.vercel.app/
- Staging: https://sodax-web-staging.vercel.app/
- Production: https://sodax.com/
