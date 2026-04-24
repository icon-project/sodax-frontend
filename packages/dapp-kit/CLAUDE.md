# packages/dapp-kit

High-level React hooks library for dApp developers. Wraps `@sodax/sdk` with React Query into feature-organized hooks. Used side-by-side with `@sodax/wallet-sdk-react` (no direct dependency — contracts shared via `@sodax/types`).

## Architecture

### Provider

`SodaxProvider` (`src/providers/SodaxProvider.tsx`) wraps the app and provides:
- `Sodax` SDK instance
- Testnet/mainnet flag
- RPC configuration for all chains

Accessed via `useSodaxContext()` hook — all other hooks use this internally.

### Hook Organization

100+ hooks organized by feature domain in `src/hooks/`:

```
hooks/
├── shared/     # useSodaxContext, useEstimateGas, useDeriveUserWalletAddress, useXBalances, Stellar trustline hooks
├── provider/   # useHubProvider, useSpokeProvider
├── swap/       # useQuote, useSwap, useStatus, useSwapAllowance, useSwapApprove, useCancelSwap, limit orders
├── mm/         # useSupply, useWithdraw, useBorrow, useRepay, useMMAllowance, useMMApprove, reserves data hooks
├── bridge/     # useBridge, useBridgeAllowance, useBridgeApprove, bridgeable amounts/tokens
├── staking/    # useStake, useUnstake, useInstantUnstake, useClaim, staking info/config hooks (21 hooks)
├── dex/        # usePools, useDexDeposit, useDexWithdraw, liquidity supply/decrease, position info (16 hooks)
├── bitcoin/    # useBitcoinBalance, Radfi auth/session/trading wallet hooks (10 hooks)
├── backend/    # Intent tracking, swap submission, orderbook, money market position queries (13 hooks)
└── migrate/    # useMigrate, useMigrationAllowance, useMigrationApprove
```

### React Query Patterns

All hooks follow consistent patterns:

**Query hooks** (data fetching):
- Hierarchical query keys: `['feature', 'action', ...params]`
- `enabled` flag gates on required params being present
- Feature-specific refetch intervals (quotes: 3s, intents: 1s, reserves: 5s, pools: never)

**Mutation hooks** (state changes):
- Wrap SDK service methods
- Invalidate related queries on success via `queryClient.invalidateQueries()`
- Return `UseMutationResult` for loading/error states

**Smart logic examples:**
- `useMMAllowance` skips on-chain checks for borrow/withdraw (never need approval)
- `useBackendIntentByTxHash` polls at 1s only when a txHash is provided

### Adding a New Hook

Follow the pattern of existing hooks in the same feature domain:
1. Create the hook file in the appropriate `hooks/<feature>/` directory
2. Use `useSodaxContext()` to access the SDK instance
3. For queries: use `useQuery` with appropriate key, enabled condition, and refetch interval
4. For mutations: use `useMutation` and invalidate related query keys on success
5. Export from the feature's `index.ts` and from `hooks/index.ts`

## Directory Structure

```
src/
├── index.ts              # Barrel export
├── contexts/             # SodaxContext definition
├── providers/            # SodaxProvider component
├── hooks/                # All feature hooks (see above)
└── utils/
    └── dex-utils.ts      # DEX param builders (deposit, withdraw, liquidity calculations)
```

## Dependencies

- `@sodax/sdk` (workspace) — core business logic
- `@sodax/types` (workspace) — shared types (including contract interfaces like `IXService`)
- `@tanstack/react-query` (peer) — server state management
- `react` (peer, >=18)
- `viem` — Ethereum utilities

## Decoupling from wallet-sdk-react

dapp-kit does **not** depend on `@sodax/wallet-sdk-react`. When a hook needs wallet-layer state (e.g. `useXBalances` needs a balance reader), the consumer injects it as a param typed against a contract interface in `@sodax/types` (e.g. `IXService`).

Consumer apps wire both packages side-by-side:

```tsx
import { useXService, getXChainType } from '@sodax/wallet-sdk-react';
import { useXBalances } from '@sodax/dapp-kit';

const xService = useXService(getXChainType(chainId));
const { data } = useXBalances({ xService, xChainId, xTokens, address });
```

This mirrors the `wallet-sdk-core` ↔ `@sodax/sdk` pattern: both packages implement or consume contracts defined in `@sodax/types`, with no direct cross-package imports.

## AI Skills (Scaffolding Guides)

See `skills/SKILLS.md` for AI-agent-friendly guides to scaffold each feature with dapp-kit hooks. Covers setup, wallet connectivity, swap, bridge, money market, staking, migration, DEX, and backend queries. All examples follow the single-object-parameter convention.

## Build

tsup: dual ESM (`.mjs`) + CJS (`.cjs`). React and React Query are externalized (not bundled).
