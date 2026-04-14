# @sodax/dapp-kit Skills

AI-agent-friendly scaffolding guides for building React dApps with `@sodax/dapp-kit`.

Each skill covers one feature domain with ready-to-use hook examples. All hooks follow the **single-object-parameter** convention.

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
