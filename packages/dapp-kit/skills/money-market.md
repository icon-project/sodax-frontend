# Skill: Money Market

Cross-chain lending (supply) and borrowing.

**Depends on:** [setup.md](setup.md), [wallet-connectivity.md](wallet-connectivity.md)

## Hooks

| Hook | Type | Purpose |
|------|------|---------|
| `useSupply` | Mutation | Supply tokens as collateral |
| `useBorrow` | Mutation | Borrow against collateral |
| `useWithdraw` | Mutation | Withdraw supplied tokens |
| `useRepay` | Mutation | Repay borrowed tokens |
| `useMMAllowance` | Query | Check approval (auto-skips for borrow/withdraw) |
| `useMMApprove` | Mutation | Approve tokens |
| `useReservesData` | Query | All reserve data |
| `useReservesUsdFormat` | Query | Reserves with USD values |
| `useUserFormattedSummary` | Query | User portfolio summary (health factor, collateral, debt) |
| `useUserReservesData` | Query | User reserve positions |
| `useAToken` | Query | aToken data |
| `useATokensBalances` | Query | aToken balances |

## Display Reserves

```tsx
import { useReservesData } from '@sodax/dapp-kit';

function ReservesList() {
  const { data: reserves, isLoading } = useReservesData({});

  if (isLoading) return <div>Loading...</div>;
  return (
    <table>
      <thead><tr><th>Asset</th><th>Supply APY</th><th>Borrow APY</th></tr></thead>
      <tbody>
        {reserves?.map((r) => (
          <tr key={r.underlyingAsset}>
            <td>{r.symbol}</td>
            <td>{(Number(r.supplyAPY) * 100).toFixed(2)}%</td>
            <td>{(Number(r.variableBorrowAPY) * 100).toFixed(2)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## User Position

```tsx
import { useUserFormattedSummary } from '@sodax/dapp-kit';

function UserPosition({ chainId, userAddress }: { chainId: SpokeChainId; userAddress: string }) {
  const { data: summary } = useUserFormattedSummary({ params: { chainId, userAddress } });
  if (!summary) return null;
  return (
    <div>
      <p>Collateral: ${summary.totalCollateralUSD}</p>
      <p>Debt: ${summary.totalBorrowsUSD}</p>
      <p>Health Factor: {summary.healthFactor}</p>
    </div>
  );
}
```

## Check Allowance + Approve

```tsx
import { useMMAllowance, useMMApprove, useSpokeProvider } from '@sodax/dapp-kit';
import { BASE_MAINNET_CHAIN_ID } from '@sodax/sdk';

function MMApproval({ params }: { params: MoneyMarketSupplyParams }) {
  const spokeProvider = useSpokeProvider({ chainId: BASE_MAINNET_CHAIN_ID });
  // auto-returns true for borrow/withdraw -- no unnecessary RPC calls
  const { data: isApproved } = useMMAllowance({ params, spokeProvider });
  const { mutateAsync: approve, isPending } = useMMApprove({ spokeProvider });

  if (isApproved?.ok && isApproved.value) return null;
  return (
    <button onClick={() => approve({ params })} disabled={isPending}>
      {isPending ? 'Approving...' : 'Approve'}
    </button>
  );
}
```

## Supply

```tsx
import { useSupply, useSpokeProvider } from '@sodax/dapp-kit';
import { BASE_MAINNET_CHAIN_ID } from '@sodax/sdk';

function SupplyButton() {
  const spokeProvider = useSpokeProvider({ chainId: BASE_MAINNET_CHAIN_ID });
  const { mutateAsync: supply, isPending } = useSupply();

  const handleSupply = async () => {
    const result = await supply({
      params: { token: '0x...', amount: 1000000n, action: 'supply' },
      spokeProvider: spokeProvider!,
    });
    if (result.ok) console.log('Supplied:', result.value);
  };

  return <button onClick={handleSupply} disabled={isPending || !spokeProvider}>{isPending ? 'Supplying...' : 'Supply'}</button>;
}
```

## Borrow / Withdraw / Repay

```tsx
// Borrow
const { mutateAsync: borrow } = useBorrow();
await borrow({ params: { token: '0x...', amount: 500000n, action: 'borrow' }, spokeProvider });

// Withdraw
const { mutateAsync: withdraw } = useWithdraw();
await withdraw({ params: { token: '0x...', amount: 1000000n, action: 'withdraw' }, spokeProvider });

// Repay
const { mutateAsync: repay } = useRepay();
await repay({ params: { token: '0x...', amount: 500000n, action: 'repay' }, spokeProvider });
```

## Types

```typescript
type MoneyMarketSupplyParams = { token: string; amount: bigint; action: 'supply'; toChainId?: SpokeChainId; toAddress?: string };
type MoneyMarketBorrowParams = { token: string; amount: bigint; action: 'borrow'; toChainId?: SpokeChainId; toAddress?: string };
type MoneyMarketWithdrawParams = { token: string; amount: bigint; action: 'withdraw'; toChainId?: SpokeChainId; toAddress?: string };
type MoneyMarketRepayParams = { token: string; amount: bigint; action: 'repay'; toChainId?: SpokeChainId; toAddress?: string };
```

## Notes

- **Borrow/withdraw skip approval** -- `useMMAllowance` returns `true` automatically.
- **Health factor < 1.0** means liquidation risk.
- All operations support optional `toChainId`/`toAddress` for cross-chain delivery.
