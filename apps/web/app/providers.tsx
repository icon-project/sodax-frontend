'use client';

// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getQueryClient } from '@/app/get-query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import type * as React from 'react';
import { wagmiConfig } from './config';
import { ChainSelectorProvider } from '@/contexts/ChainSelectorContext';

const XWagmiProviders = dynamic(() => import('@new-world/xwagmi').then(mod => mod.XWagmiProviders), { ssr: false });

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <XWagmiProviders
        config={{
          EVM: {
            wagmiConfig: wagmiConfig,
          },
          SUI: {
            isMainnet: true,
          },
          SOLANA: {
            endpoint: 'https://solana-mainnet.g.alchemy.com/v2/nCndZC8P7BdiVKkczCErdwpIgaBQpPFM',
          },
          ICON: {},
          ARCHWAY: {},
          STELLAR: {},
          HAVAH: {},
          INJECTIVE: {},
        }}
      >
        <ChainSelectorProvider defaultChain="0xa869.fuji">{children}</ChainSelectorProvider>
      </XWagmiProviders>
      {/* <ReactQueryDevtools /> */}
    </QueryClientProvider>
  );
}
