'use client';

import type { ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { SodaxProvider } from '@sodax/dapp-kit';
import { sodaxConfig, rpcConfig } from './constants';
import { getQueryClient } from '@/app/get-query-client';
import dynamic from 'next/dynamic';

//TODO gosia not sure if there's a better approach?
const SodaxWalletProvider = dynamic(() => import('@sodax/wallet-sdk-react').then(mod => mod.SodaxWalletProvider), {
  ssr: false,
});

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
