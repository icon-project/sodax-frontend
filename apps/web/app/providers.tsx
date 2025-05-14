'use client';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getQueryClient } from '@/app/get-query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import type * as React from 'react';
import { XWagmiProviders } from '@new-world/xwagmi';
import { useEffect } from 'react';
// import { ModalStoreProvider } from '@/providers/modal-store-provider.tsx';
import { wagmiConfig } from './config';

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
        {children}
      </XWagmiProviders>
      {/* <ReactQueryDevtools /> */}
    </QueryClientProvider>
  );
}
