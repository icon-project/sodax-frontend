# Skill: Bridge

Cross-chain token transfers via the hub-and-spoke vault architecture.

**Depends on:** [setup.md](setup.md), [wallet-connectivity.md](wallet-connectivity.md)

## Hooks

| Hook | Type | Purpose |
|------|------|---------|
| `useBridge` | Mutation | Execute a cross-chain bridge transfer |
| `useBridgeAllowance` | Query | Check if token approval is needed |
| `useBridgeApprove` | Mutation | Approve tokens for bridge |
| `useGetBridgeableAmount` | Query | Available bridgeable amount between two tokens |
| `useGetBridgeableTokens` | Query | Tokens bridgeable to a destination chain |

## Check Bridgeable Tokens

```tsx
import { useGetBridgeableTokens } from '@sodax/dapp-kit';
import { BASE_MAINNET_CHAIN_ID, POLYGON_MAINNET_CHAIN_ID } from '@sodax/sdk';

function BridgeableTokensList() {
  const { data: tokens } = useGetBridgeableTokens({
    params: { from: BASE_MAINNET_CHAIN_ID, to: POLYGON_MAINNET_CHAIN_ID, token: '0x...' },
  });

  if (tokens?.ok) {
    return <ul>{tokens.value.map((t) => <li key={t.address}>{t.symbol}</li>)}</ul>;
  }
  return null;
}
```

## Check Allowance + Approve

```tsx
import { useBridgeAllowance, useBridgeApprove, useSpokeProvider } from '@sodax/dapp-kit';
import { BASE_MAINNET_CHAIN_ID } from '@sodax/sdk';
import type { CreateBridgeIntentParams } from '@sodax/sdk';

function BridgeApproval({ params }: { params: CreateBridgeIntentParams }) {
  const spokeProvider = useSpokeProvider({ chainId: BASE_MAINNET_CHAIN_ID });
  const { data: isApproved } = useBridgeAllowance({ params, spokeProvider });
  const { mutateAsync: approve, isPending } = useBridgeApprove({ spokeProvider });

  if (isApproved?.ok && isApproved.value) return null;
  return (
    <button onClick={() => approve({ params })} disabled={isPending}>
      {isPending ? 'Approving...' : 'Approve for Bridge'}
    </button>
  );
}
```

## Execute Bridge

```tsx
import { useBridge, useSpokeProvider } from '@sodax/dapp-kit';
import { BASE_MAINNET_CHAIN_ID, POLYGON_MAINNET_CHAIN_ID } from '@sodax/sdk';

function BridgeButton() {
  const spokeProvider = useSpokeProvider({ chainId: BASE_MAINNET_CHAIN_ID });
  const { mutateAsync: bridge, isPending } = useBridge({ spokeProvider });

  const handleBridge = async () => {
    const result = await bridge({
      params: {
        srcChainId: BASE_MAINNET_CHAIN_ID,
        srcAsset: '0x...',
        amount: 1000000000000000000n,
        dstChainId: POLYGON_MAINNET_CHAIN_ID,
        dstAsset: '0x...',
        recipient: '0x...',
      },
    });
    if (result.ok) {
      const [spokeTxHash, hubTxHash] = result.value;
      console.log('Bridge successful:', { spokeTxHash, hubTxHash });
    }
  };

  return (
    <button onClick={handleBridge} disabled={isPending}>
      {isPending ? 'Bridging...' : 'Bridge'}
    </button>
  );
}
```

## Full Example

```tsx
import { useState } from 'react';
import { useBridge, useBridgeAllowance, useBridgeApprove, useGetBridgeableAmount, useSpokeProvider } from '@sodax/dapp-kit';
import { BASE_MAINNET_CHAIN_ID, POLYGON_MAINNET_CHAIN_ID } from '@sodax/sdk';
import type { CreateBridgeIntentParams } from '@sodax/sdk';
import { parseUnits, formatUnits } from 'viem';

export function BridgePage() {
  const [amount, setAmount] = useState('');
  const spokeProvider = useSpokeProvider({ chainId: BASE_MAINNET_CHAIN_ID });
  const parsedAmount = amount ? parseUnits(amount, 6) : 0n;

  const bridgeParams: CreateBridgeIntentParams | undefined = parsedAmount > 0n
    ? { srcChainId: BASE_MAINNET_CHAIN_ID, srcAsset: '0x...', amount: parsedAmount, dstChainId: POLYGON_MAINNET_CHAIN_ID, dstAsset: '0x...', recipient: '0x...' }
    : undefined;

  const { data: bridgeableAmount } = useGetBridgeableAmount({
    params: { srcChainId: BASE_MAINNET_CHAIN_ID, srcAsset: '0x...', dstChainId: POLYGON_MAINNET_CHAIN_ID, dstAsset: '0x...' },
  });
  const { data: allowanceResult } = useBridgeAllowance({ params: bridgeParams, spokeProvider });
  const isApproved = allowanceResult?.ok && allowanceResult.value;
  const { mutateAsync: approve, isPending: isApproving } = useBridgeApprove({ spokeProvider });
  const { mutateAsync: bridge, isPending: isBridging } = useBridge({ spokeProvider });

  const handleBridge = async () => {
    if (!bridgeParams) return;
    if (!isApproved) await approve({ params: bridgeParams });
    const result = await bridge({ params: bridgeParams });
    if (result.ok) alert(`Bridge complete! ${result.value[0]}`);
  };

  return (
    <div>
      <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      {bridgeableAmount?.ok && <p>Max: {formatUnits(bridgeableAmount.value, 6)}</p>}
      <button onClick={handleBridge} disabled={isBridging || isApproving || !bridgeParams}>
        {isApproving ? 'Approving...' : isBridging ? 'Bridging...' : 'Bridge'}
      </button>
    </div>
  );
}
```

## Types

```typescript
type CreateBridgeIntentParams = {
  srcChainId: SpokeChainId;
  srcAsset: string;
  amount: bigint;
  dstChainId: SpokeChainId;
  dstAsset: string;
  recipient: string;
  partnerFee?: { address: string; percentage: number };
};
```
