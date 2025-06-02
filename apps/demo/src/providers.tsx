import React, { type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from './config';
import { XWagmiProviders } from '@new-world/xwagmi';
import { SodaxProvider } from '@new-world/dapp-kit';
import { sodaxConfig } from './constants';
const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SodaxProvider testnet={false} config={sodaxConfig}>
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
      </QueryClientProvider>
    </SodaxProvider>
  );
}
