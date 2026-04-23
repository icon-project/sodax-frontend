# @sodax/dapp-kit Skills

Scaffolding guides that let you add SODAX features to your React app in one prompt. These skills are built for and tested with [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Point it at a skill file, and it generates the correct hooks, providers, and types for you.

## Frontend vs Backend

These skills are for **frontend (React) integration** — wallet connection, React hooks, UI components.

**If you're building a backend** (API server, bot, script), you don't need `@sodax/dapp-kit` or `@sodax/wallet-sdk-react` at all. Use `@sodax/sdk` directly with a private key:

```ts
import { Sodax, EvmSpokeProvider } from '@sodax/sdk';

const sodax = new Sodax({ rpcConfig: { /* ... */ } });
const spokeProvider = new EvmSpokeProvider({ privateKey: '0x...' });
const quote = await sodax.swaps.getQuote({ /* ... */ });
const result = await sodax.swaps.swap({ intentParams, spokeProvider });
```

No React, no wallet connection, no hooks. See `packages/sdk/CLAUDE.md` for SDK-only usage.

## Quick Start

Skills ship with the npm package. After installing `@sodax/dapp-kit`:

**1. Set up providers** (do this first)

> Read `node_modules/@sodax/dapp-kit/skills/setup.md` and set up my React app with @sodax/dapp-kit.

**2. Add wallet connectivity**

> Read `node_modules/@sodax/dapp-kit/skills/wallet-connectivity.md` and add wallet connection to my app.

**3. Add a feature** — pick any one:

> Read `node_modules/@sodax/dapp-kit/skills/swap.md` and add cross-chain swap to my app.

> Read `node_modules/@sodax/dapp-kit/skills/money-market.md` and add lending and borrowing to my app.

> Read `node_modules/@sodax/dapp-kit/skills/staking.md` and add SODA staking to my app.

The pattern is always: `Read node_modules/@sodax/dapp-kit/skills/<feature>.md` + what you want to build.

### Tips

- One feature per prompt gets better results than asking for everything at once
- Always do setup + wallet-connectivity before any feature
- Available features: `swap`, `bridge`, `money-market`, `staking`, `migration`, `dex`, `bitcoin`, `backend-queries`

---

*Internal devs working in this monorepo: use `skills/<feature>.md` instead of the `node_modules` path, and reference sibling hooks for patterns.*

## Dependency Graph

```
setup
  └── wallet-connectivity
        ├── swap
        ├── bridge
        ├── money-market
        ├── staking
        ├── migration
        ├── dex
        └── bitcoin

setup
  └── backend-queries (read-only, no wallet needed)
```

## Skill Index

| Skill | File | Description | Depends On |
|-------|------|-------------|------------|
| Setup | [setup.md](setup.md) | Install packages, wire `SodaxProvider` + `QueryClientProvider` | None |
| Wallet Connectivity | [wallet-connectivity.md](wallet-connectivity.md) | `useSpokeProvider` and wallet connection hooks | `setup` |
| Swap | [swap.md](swap.md) | `useQuote`, `useSwap`, `useSwapAllowance`, `useSwapApprove`, limit orders | `setup`, `wallet-connectivity` |
| Bridge | [bridge.md](bridge.md) | `useBridge`, `useBridgeAllowance`, `useBridgeApprove`, bridgeable tokens | `setup`, `wallet-connectivity` |
| Money Market | [money-market.md](money-market.md) | `useSupply`, `useBorrow`, `useWithdraw`, `useRepay`, reserves data | `setup`, `wallet-connectivity` |
| Staking | [staking.md](staking.md) | `useStake`, `useUnstake`, `useClaim`, staking info, ratios | `setup`, `wallet-connectivity` |
| Migration | [migration.md](migration.md) | `useMigrate`, `useMigrationAllowance`, ICX/bnUSD/BALN migration | `setup`, `wallet-connectivity` |
| DEX | [dex.md](dex.md) | `useDexDeposit`, `useSupplyLiquidity`, positions, pools | `setup`, `wallet-connectivity` |
| Bitcoin | [bitcoin.md](bitcoin.md) | `useRadfiSession`, `useFundTradingWallet`, `useRadfiWithdraw`, UTXO management | `setup`, `wallet-connectivity` |
| Backend Queries | [backend-queries.md](backend-queries.md) | `useBackendIntentByTxHash`, `useBackendOrderbook`, money market data | `setup` |

## Hook Conventions

### Single Object Parameter

Every hook accepts one object. Never positional args.

```tsx
// Query hooks
const { data } = useSwapAllowance({ params, spokeProvider, queryOptions });

// Mutation hooks
const { mutateAsync: swap } = useSwap({ spokeProvider });
await swap({ params: intentParams });
```

### queryOptions

All query hooks accept optional `queryOptions` to override React Query defaults:

```tsx
const { data } = useQuote({
  params: quotePayload,
  queryOptions: { staleTime: 5000, refetchInterval: 10000 },
});
```

### Result Type

SDK methods return `Result<T, E>`. Always check `.ok` before accessing `.value`:

```tsx
if (result.ok) {
  const data = result.value;
} else {
  console.error(result.error);
}
```

### BigInt

Token amounts are `bigint` scaled by decimals. Use `viem` helpers:

```tsx
import { parseUnits, formatUnits } from 'viem';
const amount = parseUnits('1.5', 18);  // 1500000000000000000n
const display = formatUnits(amount, 18); // '1.5'
```
