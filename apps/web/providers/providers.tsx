'use client';

import type { ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { SodaxWalletProvider } from '@sodax/wallet-sdk-react';
import { SodaxProvider } from '@sodax/dapp-kit';
import { sodaxConfig, rpcConfig } from './constants';
import { getQueryClient } from '@/app/get-query-client';

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <SodaxProvider testnet={false} config={sodaxConfig} rpcConfig={rpcConfig}>
      <QueryClientProvider client={queryClient}>
        <SodaxWalletProvider rpcConfig={rpcConfig}>{children}</SodaxWalletProvider>
      </QueryClientProvider>
    </SodaxProvider>
  );
}
