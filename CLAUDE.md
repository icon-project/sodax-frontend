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
- **Never use `bigint` in types that will be passed to `JSON.stringify`** — it throws `TypeError` at runtime. Use `string` for numeric fields in API request/response types. If `bigint` is needed in domain types, convert to string before serialization.


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

## Architecture Notes

### Web App (`apps/web`)

- **Routing**: Next.js App Router. Feature routes under `app/(apps)/` (swap, loans, save, stake, migrate, partner).
- **State**: Zustand stores in `stores/` (app-store for chain/page state, modal-store for modals). Server state via `@tanstack/react-query`.
- **Provider stack** (in `providers/providers.tsx`): `SodaxProvider` → `QueryClientProvider` → `SodaxWalletProvider`
- **UI**: shadcn/ui components (Radix UI) in `components/ui/`, shared components in `components/shared/`
- **Hooks**: Feature-specific hooks in `hooks/` (chain balances, token prices, APY, etc.)
- **CMS**: TipTap editor, Notion integration, MongoDB backend in `lib/`

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
