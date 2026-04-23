# Skill: Wallet Connectivity

Connect wallets and create spoke providers for on-chain operations.

**Depends on:** [setup.md](setup.md)

## Hooks

| Hook | Type | Purpose |
|------|------|---------|
| `useSpokeProvider` | Utility | Create a spoke provider for a chain from connected wallet |
| `useHubProvider` | Utility | Access the hub chain (Sonic) provider |
| `useDeriveUserWalletAddress` | Query | Derive hub wallet address from spoke address (CREATE3) |
| `useGetUserHubWalletAddress` | Query | Derive hub wallet address from spoke address (wallet router) |
| `useEstimateGas` | Mutation | Estimate gas for raw transactions |
| `useStellarTrustlineCheck` | Query | Check if Stellar account has sufficient trustline |
| `useRequestTrustline` | Utility | Request a Stellar trustline for a token |

## Connect a Wallet

`@sodax/wallet-sdk-react` provides per-chain wallet hooks (optional dependency; see `setup.md`):

```tsx
import { useEvmWallet } from '@sodax/wallet-sdk-react';

function ConnectButton() {
  const { connect, disconnect, address, isConnected } = useEvmWallet();

  if (isConnected) {
    return (
      <div>
        <span>{address}</span>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }
  return <button onClick={() => connect()}>Connect Wallet</button>;
}
```

## Create a Spoke Provider

Once a wallet is connected, create a spoke provider for the chain you need:

```tsx
import { useSpokeProvider } from '@sodax/dapp-kit';
import { BSC_MAINNET_CHAIN_ID } from '@sodax/sdk';

function MyFeature() {
  const spokeProvider = useSpokeProvider({ chainId: BSC_MAINNET_CHAIN_ID });
  // undefined until wallet is connected
  // Pass to any feature hook: useSwap({ spokeProvider }), useBridge({ spokeProvider }), etc.
}
```

## Fetch Token Balances

`useXBalances` from `@sodax/wallet-sdk-react` fetches on-chain balances for a wallet address:

```tsx
import { useXBalances } from '@sodax/wallet-sdk-react';
import { BSC_MAINNET_CHAIN_ID } from '@sodax/sdk';

function TokenBalance({ walletAddress }: { walletAddress: string }) {
  const { data: balances } = useXBalances({
    address: walletAddress,
    chainId: BSC_MAINNET_CHAIN_ID,
  });

  // balances is a map of token address → balance (bigint)
}
```

Use this alongside any feature hook to show the user's available balance before a swap, bridge, supply, etc.

## Use in Feature Hooks

Every mutation hook takes `{ spokeProvider }` at initialization:

```tsx
import { useSwap, useSpokeProvider } from '@sodax/dapp-kit';
import { BSC_MAINNET_CHAIN_ID } from '@sodax/sdk';

function SwapButton() {
  const spokeProvider = useSpokeProvider({ chainId: BSC_MAINNET_CHAIN_ID });
  const { mutateAsync: swap, isPending } = useSwap({ spokeProvider });
  // swap({ params }) uses the connected wallet to sign
}
```
