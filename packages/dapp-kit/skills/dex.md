# Skill: DEX

Concentrated liquidity positions and asset management.

**Depends on:** [setup.md](setup.md), [wallet-connectivity.md](wallet-connectivity.md)

## Hooks

### Assets

| Hook | Type | Purpose |
|------|------|---------|
| `useDexDeposit` | Mutation | Deposit assets into pool tokens |
| `useDexWithdraw` | Mutation | Withdraw assets from pool tokens |
| `useDexAllowance` | Query | Check approval for deposit |
| `useDexApprove` | Mutation | Approve tokens |
| `usePoolBalances` | Query | User's pool token balances |

### Liquidity

| Hook | Type | Purpose |
|------|------|---------|
| `useSupplyLiquidity` | Mutation | Supply liquidity to a position |
| `useDecreaseLiquidity` | Mutation | Remove liquidity |
| `useClaimRewards` | Mutation | Claim trading fees |
| `usePools` | Query | List available pools |
| `usePoolData` | Query | Pool details (price, tick, liquidity) |
| `usePositionInfo` | Query | Position details |
| `useLiquidityAmounts` | Query | Token amounts for a tick range |

### Param Builders

| Hook | Purpose |
|------|---------|
| `useCreateDepositParams` | Build deposit params with ERC-4626 conversion |
| `useCreateWithdrawParams` | Build withdraw params |
| `useCreateSupplyLiquidityParams` | Build tick range + liquidity params |
| `useCreateDecreaseLiquidityParams` | Build decrease params from position state |

## List Pools

```tsx
import { usePools } from '@sodax/dapp-kit';

function PoolsList() {
  const { data: pools } = usePools({});
  return (
    <div>
      {pools?.map((pool) => (
        <div key={pool.poolAddress}>
          <h3>{pool.token0Symbol}/{pool.token1Symbol}</h3>
          <p>Fee: {pool.fee / 10000}%</p>
        </div>
      ))}
    </div>
  );
}
```

## Deposit Assets

```tsx
import { useDexDeposit, useDexAllowance, useDexApprove, useSpokeProvider } from '@sodax/dapp-kit';
import { BASE_MAINNET_CHAIN_ID } from '@sodax/sdk';

function DepositToPool() {
  const spokeProvider = useSpokeProvider({ chainId: BASE_MAINNET_CHAIN_ID });
  const depositParams = { asset: '0x...', amount: 1000000000000000000n, poolToken: '0x...' };

  const { data: allowance } = useDexAllowance({ params: depositParams, spokeProvider });
  const isApproved = allowance?.ok && allowance.value;
  const { mutateAsync: approve, isPending: isApproving } = useDexApprove({ spokeProvider });
  const { mutateAsync: deposit, isPending: isDepositing } = useDexDeposit({ spokeProvider });

  const handleDeposit = async () => {
    if (!isApproved) await approve({ params: depositParams });
    const result = await deposit({ params: depositParams });
    if (result.ok) console.log('Deposited:', result.value);
  };

  return (
    <button onClick={handleDeposit} disabled={isDepositing || isApproving}>
      {isApproving ? 'Approving...' : isDepositing ? 'Depositing...' : 'Deposit'}
    </button>
  );
}
```

## Supply Liquidity

```tsx
import { useSupplyLiquidity, useCreateSupplyLiquidityParams, useSpokeProvider } from '@sodax/dapp-kit';
import { BASE_MAINNET_CHAIN_ID } from '@sodax/sdk';

function SupplyLiquidity() {
  const spokeProvider = useSpokeProvider({ chainId: BASE_MAINNET_CHAIN_ID });
  const supplyParams = useCreateSupplyLiquidityParams({
    params: { poolKey: { /* ... */ }, tickLower: -60000n, tickUpper: 60000n, amount0: 1000000000000000000n, amount1: 1000000000000000000n },
  });
  const { mutateAsync: supplyLiquidity, isPending } = useSupplyLiquidity({ spokeProvider });

  return (
    <button disabled={isPending || !supplyParams} onClick={async () => {
      const result = await supplyLiquidity({ params: supplyParams! });
      if (result.ok) console.log('Supplied:', result.value);
    }}>
      {isPending ? 'Supplying...' : 'Supply Liquidity'}
    </button>
  );
}
```

## Position + Claim Rewards

```tsx
import { usePositionInfo, useClaimRewards, useSpokeProvider } from '@sodax/dapp-kit';
import { BASE_MAINNET_CHAIN_ID } from '@sodax/sdk';

function Position({ positionId, poolKey }: { positionId: bigint; poolKey: PoolKey }) {
  const spokeProvider = useSpokeProvider({ chainId: BASE_MAINNET_CHAIN_ID });
  const { data: position } = usePositionInfo({ params: { tokenId: positionId, poolKey } });
  const { mutateAsync: claimRewards, isPending } = useClaimRewards({ spokeProvider });

  if (!position) return null;
  return (
    <div>
      <p>Liquidity: {position.liquidity.toString()}</p>
      <p>Range: [{position.tickLower}, {position.tickUpper}]</p>
      <button onClick={() => claimRewards({ params: { positionId } })} disabled={isPending}>Claim Fees</button>
    </div>
  );
}
```

## Remove Liquidity

```tsx
const { mutateAsync: decreaseLiquidity } = useDecreaseLiquidity({ spokeProvider });
await decreaseLiquidity({
  params: { positionId, liquidity: 500000n, amount0Min: 0n, amount1Min: 0n },
});
```

## Notes

- **Two-step flow**: deposit assets (spoke -> hub pool tokens) then supply liquidity (pool tokens -> position).
- **Ticks**: logarithmic price units (like Uniswap V3). Wider range = more trades, less capital efficiency.
- **ERC-4626**: pool tokens are vault shares. Use `useCreateDepositParams` to handle the conversion.
