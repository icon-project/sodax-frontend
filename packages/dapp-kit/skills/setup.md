# Skill: Setup

Install and wire `@sodax/dapp-kit` into a React project.

**Depends on:** None

## Install

```bash
# Required
pnpm add @sodax/dapp-kit @tanstack/react-query

# Optional (only if you want built-in wallet connectivity hooks + providers)
pnpm add @sodax/wallet-sdk-react
```

## Wire Providers

```tsx
// providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SodaxProvider } from '@sodax/dapp-kit';
import type { SodaxConfig } from '@sodax/sdk';
import type { RpcConfig } from '@sodax/types';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5_000, retry: 2 } },
});

const rpcConfig: RpcConfig = {
  '0xa4b1.arbitrum': 'https://arb1.arbitrum.io/rpc',
  '0x2105.base': 'https://mainnet.base.org',
  '0x38.bsc': 'https://bsc-dataseed.binance.org',
  '0x89.polygon': 'https://polygon-rpc.com',
  // Add chains your dApp needs
};

// Optional SDK config (partner fees, custom endpoints)
const sdkConfig: SodaxConfig = {};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SodaxProvider config={sdkConfig} rpcConfig={rpcConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SodaxProvider>
  );
}
```

### Optional: Add Wallet Provider

If you want to use `@sodax/dapp-kit` wallet helpers like `useSpokeProvider`, install and wrap `SodaxWalletProvider`:

```tsx
import { SodaxWalletProvider } from '@sodax/wallet-sdk-react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SodaxProvider config={sdkConfig} rpcConfig={rpcConfig}>
      <QueryClientProvider client={queryClient}>
        <SodaxWalletProvider>{children}</SodaxWalletProvider>
      </QueryClientProvider>
    </SodaxProvider>
  );
}
```

## Initialize SDK (Optional)

For dynamic config (latest tokens/chains from backend API):

```tsx
import { useEffect } from 'react';
import { useSodaxContext } from '@sodax/dapp-kit';

export function useInitializeSodax() {
  const { sodax } = useSodaxContext();

  useEffect(() => {
    sodax.initialize().then((result) => {
      if (!result.ok) console.error('Failed to initialize Sodax:', result.error);
    });
  }, [sodax]);
}
```

## Chain ID Constants

```tsx
import {
  SONIC_MAINNET_CHAIN_ID,      // '0x92.sonic' (hub)
  ARBITRUM_MAINNET_CHAIN_ID,   // '0xa4b1.arbitrum'
  BASE_MAINNET_CHAIN_ID,       // '0x2105.base'
  BSC_MAINNET_CHAIN_ID,        // '0x38.bsc'
  ETHEREUM_MAINNET_CHAIN_ID,   // '0x1.ethereum'
  POLYGON_MAINNET_CHAIN_ID,    // '0x89.polygon'
  OPTIMISM_MAINNET_CHAIN_ID,   // '0xa.optimism'
  AVALANCHE_MAINNET_CHAIN_ID,  // '0xa86a.avalanche'
  SUI_MAINNET_CHAIN_ID,        // 'sui:mainnet'
  STELLAR_MAINNET_CHAIN_ID,    // 'stellar:mainnet'
  SOLANA_MAINNET_CHAIN_ID,     // 'solana:mainnet'
  ICON_MAINNET_CHAIN_ID,       // '0x1.icon'
  INJECTIVE_MAINNET_CHAIN_ID,  // 'injective-1'
  NEAR_MAINNET_CHAIN_ID,       // 'near:mainnet'
  STACKS_MAINNET_CHAIN_ID,     // 'stacks:mainnet'
  BITCOIN_MAINNET_CHAIN_ID,    // 'bitcoin:mainnet'
} from '@sodax/sdk';
```
