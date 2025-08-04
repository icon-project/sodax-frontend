'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { XWagmiProviders } from '@sodax/wallet-sdk';
import { sonic } from '../config/web3';

// Define XConfig type locally since it's not exported from wallet-sdk
type XConfig = {
  EVM: {
    chains: number[];
  };
  SUI: {
    isMainnet: boolean;
  };
  SOLANA: {
    endpoint: string;
  };
  ICON: Record<string, never>;
  INJECTIVE: Record<string, never>;
  STELLAR: Record<string, never>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const xConfig: XConfig = {
  EVM: {
    chains: [sonic.id, 1, 11155111], // sonic, mainnet, sepolia
  },
  SUI: {
    isMainnet: true,
  },
  SOLANA: {
    endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  },
  ICON: {},
  INJECTIVE: {},
  STELLAR: {},
};

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <XWagmiProviders config={xConfig}>
        {children}
      </XWagmiProviders>
    </QueryClientProvider>
  );
}
