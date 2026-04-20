# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Each package under `packages/` has its own `CLAUDE.md` with package-specific guidance — read the relevant one before working in that package.

## Project Overview

SODAX is a cross-chain DeFi platform built on a **hub-and-spoke architecture** where **Sonic is the hub chain**. It supports swaps (intent-based via solver), lending/borrowing (money market), staking, bridging, DEX (concentrated liquidity), token migration, and partner fee operations across 20 blockchains:

- **EVM (12):** Sonic (hub), Ethereum, Arbitrum, Base, BSC, Optimism, Polygon, Avalanche, HyperEVM, Lightlink, Redbelly, Kaia
- **Non-EVM (8):** Solana, Sui, Stellar, ICON, Injective, NEAR, Stacks, Bitcoin

## Monorepo Structure

Turborepo + pnpm workspace. Package manager: **pnpm 10.32.1**.

### Apps

- `apps/web` — Main Next.js 15 web app (App Router, React 19, Tailwind CSS, shadcn/ui)
- `apps/demo` — Vite + React demo app for SDK showcase
- `apps/node` — Node.js scripts for E2E testing various chain operations

### Packages

- `packages/sdk` — **Core SDK.** Hub-and-spoke service architecture. Modules: `swap`, `bridge`, `moneyMarket`, `staking`, `migration`, `partner`, `dex`, `backendApi`. Entry point: `Sodax` class. See `packages/sdk/CLAUDE.md`.
- `packages/types` — Shared TypeScript type definitions: chain IDs, chain configs, wallet provider interfaces, backend API types, constants for all 20 chains. See `packages/types/CLAUDE.md`.
- `packages/wallet-sdk-core` — Low-level multi-chain wallet providers (signing, broadcasting) for 9 chain types. Dual config: private-key (scripts/testing) and browser-extension (production). See `packages/wallet-sdk-core/CLAUDE.md`.
- `packages/wallet-sdk-react` — React layer over wallet-sdk-core. Abstract `XService`/`XConnector` pattern, Zustand state persistence, EIP-6963 wallet discovery. See `packages/wallet-sdk-react/CLAUDE.md`.
- `packages/dapp-kit` — High-level React hooks (100+) combining SDK + wallet-sdk-react + React Query. Organized by feature domain. See `packages/dapp-kit/CLAUDE.md`.
- `packages/typescript-config` — Shared tsconfig base files (only actively used for next at the moment)

### Package dependency chain (current)

```
types → sdk → wallet-sdk-core → wallet-sdk-react → dapp-kit → apps/web
```

### Target dependency chain (v2)

```
sdk (absorbs types) → wallet-sdk-core → wallet-sdk-react → dapp-kit → apps/web
                  ↘                                    ↗
                    ──────────────────────────────────
```

- `sdk` absorbs `types` package (no more `@sodax/types`)
- `wallet-sdk-core` depends only on SDK types
- `wallet-sdk-react` depends only on `wallet-sdk-core`
- `dapp-kit` depends on `sdk` + `wallet-sdk-react`

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

### Running tests for a specific package

```bash
cd packages/<pkg> && pnpm test          # Unit tests (excludes e2e)
cd packages/<pkg> && pnpm test-e2e      # E2E tests only
cd packages/<pkg> && pnpm coverage      # Coverage report
```

To run a single test file with Vitest:
```bash
cd packages/<pkg> && npx vitest run path/to/test.test.ts
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
- **No `as unknown as <Type>` double-casts in non-test source files.** This pattern strips the type system entirely and hides real issues (bad generic inference, wrong param shapes, unmodeled union). If you feel the need for one, stop and fix the underlying type — add a proper generic/conditional, a narrowing guard, or an overload. Allowed only inside `*.test.ts` / `*.test.tsx` where mocks intentionally defeat types.

Formatting: 2-space indent, 120 char line width, single quotes, semicolons required, trailing commas, LF line endings.

**Important:** Some packages have local `biome.json` overrides that relax root rules (e.g., `wallet-sdk-core` disables `noNonNullAssertion` and `noExplicitAny`). These are **tech debt** — always flag them and suggest fixing the underlying code rather than relying on the override.

Pre-commit hooks (via Husky + lint-staged) auto-format and lint staged files. Commits must follow **conventional commits** format (enforced by commitlint).

## Common Pitfalls

- **Never use `bigint` in types that will be passed to `JSON.stringify`** — it throws `TypeError` at runtime. Use `string` for numeric fields in API request/response types. If `bigint` is needed in domain types, convert to string before serialization.
- **Build order matters** — packages must build before apps. Use `pnpm build:packages` first, or `pnpm build` which handles ordering via Turborepo.
- **All SDK packages produce dual ESM/CJS output** via tsup. Use `.js` extensions in relative imports within source (tsup resolves them).

## Architecture Notes

### Hub-and-Spoke Model

All cross-chain operations route through the **hub chain (Sonic)**. The SDK models this via:
- `EvmHubProvider` — interacts with hub contracts (vault tokens, asset manager, wallet abstraction)
- Per-chain `SpokeProvider` implementations — handle chain-specific contract calls, then relay to/from hub
- `IntentRelayApiService` — relays intents between hub and spoke chains

### Web App (`apps/web`)

- **Routing**: Next.js App Router. Feature routes under `app/(apps)/` (swap, loans, save, stake, migrate, partner).
- **State**: Zustand stores in `stores/` (app-store for chain/page state, modal-store for modals). Server state via `@tanstack/react-query`.
- **Provider stack** (in `providers/providers.tsx`): `SodaxProvider` → `QueryClientProvider` → `SodaxWalletProvider`
- **UI**: shadcn/ui components (Radix UI) in `components/ui/`, shared components in `components/shared/`
- **Hooks**: Feature-specific hooks in `hooks/` (chain balances, token prices, APY, etc.)
- **CMS**: TipTap editor, Notion integration, MongoDB backend in `lib/`

### SDK Package Overview

| Package | Role | Build | Key Abstractions |
|---------|------|-------|-----------------|
| `sdk` | Core business logic | tsup (ESM+CJS) | `Sodax` facade, `*Service` classes, `*SpokeProvider`, `EvmHubProvider` |
| `types` | Shared type definitions | tsc | Chain configs, wallet provider interfaces, backend API types |
| `wallet-sdk-core` | Wallet signing/broadcasting | tsup (ESM+CJS) | `*WalletProvider` per chain (private-key + browser-extension configs) |
| `wallet-sdk-react` | React wallet state | tsup (ESM+CJS) | `XService`/`XConnector` abstractions, Zustand store, `SodaxWalletProvider` |
| `dapp-kit` | React hooks for dApps | tsup (ESM+CJS) | `SodaxProvider`, 100+ feature-organized hooks via React Query |

## CI Pipeline

GitHub Actions runs on push to `main`/`development` and all PRs:
1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm build:packages`
4. `pnpm checkTs`
5. `pnpm build`

Tested against Node.js 20.x, 22.x, 24.x.

## Git Flow

### Web application (apps/web)
Branches: `main` (dev) → `staging` → `production`
- Main: https://sodax-web-dev.vercel.app/
- Staging: https://sodax-web-staging.vercel.app/
- Production: https://sodax.com/
