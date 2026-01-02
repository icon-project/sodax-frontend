'use client';

import type { ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { SodaxWalletProvider } from '@sodax/wallet-sdk-react';
import { SodaxProvider } from '@sodax/dapp-kit';
import { sodaxConfig, rpcConfig, developmentRpcConfig } from './constants';
import { getQueryClient } from '@/app/get-query-client';

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  const _rpcConfig = process.env.NODE_ENV === 'development' ? developmentRpcConfig : rpcConfig;

  return (
    <SodaxProvider testnet={false} config={sodaxConfig} rpcConfig={_rpcConfig}>
      <QueryClientProvider client={queryClient}>
        <SodaxWalletProvider rpcConfig={_rpcConfig}>{children}</SodaxWalletProvider>
      </QueryClientProvider>
    </SodaxProvider>
  );
}
