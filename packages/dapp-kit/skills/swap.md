# Skill: Swap

Cross-chain token swaps via the intent-based solver.

**Depends on:** [setup.md](setup.md), [wallet-connectivity.md](wallet-connectivity.md)

## Hooks

| Hook | Type | Purpose |
|------|------|---------|
| `useQuote` | Query | Real-time swap quote (auto-refreshes 3s) |
| `useSwap` | Mutation | Execute a complete cross-chain swap |
| `useSwapAllowance` | Query | Check if token approval is needed |
| `useSwapApprove` | Mutation | Approve tokens for the swap contract |
| `useStatus` | Query | Track intent execution status |
| `useCancelSwap` | Mutation | Cancel an active swap intent |
| `useCreateLimitOrder` | Mutation | Create a limit order (no deadline) |
| `useCancelLimitOrder` | Mutation | Cancel an active limit order |

## Get a Quote

```tsx
import { useQuote } from '@sodax/dapp-kit';
import { BSC_MAINNET_CHAIN_ID, ARBITRUM_MAINNET_CHAIN_ID } from '@sodax/sdk';

function SwapQuote({ inputAmount }: { inputAmount: bigint }) {
  const { data: quoteResult, isLoading } = useQuote({
    params: inputAmount > 0n
      ? {
          token_src: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
          token_dst: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
          token_src_blockchain_id: BSC_MAINNET_CHAIN_ID,
          token_dst_blockchain_id: ARBITRUM_MAINNET_CHAIN_ID,
          amount: inputAmount,
          quote_type: 'exact_input',
        }
      : undefined,
  });

  if (isLoading) return <div>Fetching quote...</div>;
  if (quoteResult?.ok) return <div>Output: {quoteResult.value.quoted_amount}</div>;
  return null;
}
```

## Check Allowance + Approve

```tsx
import { useSwapAllowance, useSwapApprove, useSpokeProvider } from '@sodax/dapp-kit';
import { BSC_MAINNET_CHAIN_ID } from '@sodax/sdk';
import type { CreateIntentParams } from '@sodax/sdk';

function SwapApproval({ intentParams }: { intentParams: CreateIntentParams }) {
  const spokeProvider = useSpokeProvider({ chainId: BSC_MAINNET_CHAIN_ID });

  const { data: isApproved } = useSwapAllowance({ params: intentParams, spokeProvider });
  const { mutateAsync: approve, isPending } = useSwapApprove({ spokeProvider });

  if (isApproved?.ok && isApproved.value) return null;
  return (
    <button onClick={() => approve({ params: intentParams })} disabled={isPending}>
      {isPending ? 'Approving...' : 'Approve Token'}
    </button>
  );
}
```

## Execute Swap

```tsx
import { useSwap } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk-react';
import { ChainKeys } from '@sodax/sdk';
import type { CreateIntentParams } from '@sodax/sdk';

function SwapButton({ intentParams }: { intentParams: CreateIntentParams }) {
  const walletProvider = useWalletProvider(ChainKeys.BSC_MAINNET);
  const { mutateAsync: swap, isPending } = useSwap();

  const handleSwap = async () => {
    if (!walletProvider) return;
    const result = await swap({ params: intentParams, walletProvider });
    if (result.ok) {
      const [executionResponse, intent, deliveryInfo] = result.value;
      console.log('Swap successful!', executionResponse);
    }
  };

  return (
    <button onClick={handleSwap} disabled={isPending || !walletProvider}>
      {isPending ? 'Swapping...' : 'Swap'}
    </button>
  );
}
```

## Full Example

```tsx
import { useState } from 'react';
import { useQuote, useSwap, useSwapAllowance, useSwapApprove, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk-react';
import { BSC_MAINNET_CHAIN_ID, ARBITRUM_MAINNET_CHAIN_ID, ChainKeys } from '@sodax/sdk';
import type { CreateIntentParams, SolverIntentQuoteRequest } from '@sodax/sdk';
import { parseUnits } from 'viem';

const SRC_TOKEN = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';
const DST_TOKEN = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f';

export function SwapPage() {
  const [inputAmount, setInputAmount] = useState('');
  const spokeProvider = useSpokeProvider({ chainId: BSC_MAINNET_CHAIN_ID });
  const walletProvider = useWalletProvider(ChainKeys.BSC_MAINNET);
  const parsedAmount = inputAmount ? parseUnits(inputAmount, 18) : 0n;

  // 1. Quote
  const { data: quoteResult, isLoading: isQuoting } = useQuote({
    params: parsedAmount > 0n
      ? {
          token_src: SRC_TOKEN,
          token_dst: DST_TOKEN,
          token_src_blockchain_id: BSC_MAINNET_CHAIN_ID,
          token_dst_blockchain_id: ARBITRUM_MAINNET_CHAIN_ID,
          amount: parsedAmount,
          quote_type: 'exact_input',
        }
      : undefined,
  });

  // 2. Build intent params
  const intentParams: CreateIntentParams | undefined =
    quoteResult?.ok && spokeProvider
      ? {
          inputToken: SRC_TOKEN,
          outputToken: DST_TOKEN,
          inputAmount: parsedAmount,
          minOutputAmount: BigInt(quoteResult.value.quoted_amount),
          deadline: 0n,
          allowPartialFill: false,
          srcChain: BSC_MAINNET_CHAIN_ID,
          dstChain: ARBITRUM_MAINNET_CHAIN_ID,
          srcAddress: '0x...', // connected wallet address
          dstAddress: '0x...', // destination address
          solver: '0x0000000000000000000000000000000000000000',
          data: '0x',
        }
      : undefined;

  // 3. Allowance
  const { data: allowanceResult } = useSwapAllowance({ params: intentParams, spokeProvider });
  const isApproved = allowanceResult?.ok && allowanceResult.value;

  // 4. Approve + Swap
  const { mutateAsync: approve, isPending: isApproving } = useSwapApprove({ spokeProvider });
  const { mutateAsync: swap, isPending: isSwapping } = useSwap();

  const handleSwap = async () => {
    if (!intentParams || !walletProvider) return;
    if (!isApproved) await approve({ params: intentParams });
    const result = await swap({ params: intentParams, walletProvider });
    if (result.ok) alert('Swap successful!');
  };

  return (
    <div>
      <input placeholder="Amount" value={inputAmount} onChange={(e) => setInputAmount(e.target.value)} />
      {isQuoting && <p>Fetching quote...</p>}
      {quoteResult?.ok && <p>Output: {quoteResult.value.quoted_amount}</p>}
      <button onClick={handleSwap} disabled={isSwapping || isApproving || !intentParams}>
        {isApproving ? 'Approving...' : isSwapping ? 'Swapping...' : 'Swap'}
      </button>
    </div>
  );
}
```

## Limit Orders

```tsx
const { mutateAsync: createLimitOrder } = useCreateLimitOrder({ spokeProvider });
const { mutateAsync: cancelLimitOrder } = useCancelLimitOrder({ spokeProvider });

// Limit orders have no deadline, must be cancelled manually
await createLimitOrder({ params: intentParams });
```

## Gotchas

### Token list has duplicate addresses

`getSupportedSolverTokens()` can return multiple tokens sharing the same contract address (same token on different chains). When rendering token lists, use a composite key like `${token.address}-${token.blockchain_id}` — not `token.address` alone.

### Balance display

Balances come from `@sodax/wallet-sdk-react`, not from dapp-kit. See `wallet-connectivity.md` for `useXBalances`.

## Types

```typescript
type CreateIntentParams = {
  inputToken: string;
  outputToken: string;
  inputAmount: bigint;
  minOutputAmount: bigint;
  deadline: bigint;            // 0n = no deadline
  allowPartialFill: boolean;
  srcChain: SpokeChainId;
  dstChain: SpokeChainId;
  srcAddress: string;
  dstAddress: string;
  solver: Address;             // address(0) = any solver
  data: Hex;
};
```
