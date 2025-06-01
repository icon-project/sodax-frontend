import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from './config';
import { XWagmiProviders } from '@new-world/xwagmi';
import { SodaxProvider } from '@new-world/dapp-kit';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SodaxProvider testnet={false}>
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
