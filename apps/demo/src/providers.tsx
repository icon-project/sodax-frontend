import React, { useMemo, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SodaxWalletProvider } from '@sodax/wallet-sdk-react';
import type { RpcConfig } from '@sodax/types';
import { SodaxProvider } from '@sodax/dapp-kit';
import { productionSolverConfig, stagingSolverConfig } from './constants';
import type { SodaxConfig } from '@sodax/sdk';
import { useAppStore } from './zustand/useAppStore';

const queryClient = new QueryClient();

const rpcConfig: RpcConfig = {
  //solana
  solana: process.env.SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/fnxOcaJJQBJZeMMFpLqwg',
  //stellar
  stellar: {
    horizonRpcUrl: 'https://horizon.stellar.org',
    sorobanRpcUrl: 'https://magical-bitter-frost.stellar-mainnet.quiknode.pro/78709b736890cf5a9bcb36e118b9d18e8ecdb7ee',
  },
};

export default function Providers({ children }: { children: ReactNode }) {
  const { isSolverProduction } = useAppStore();

  const sodaxConfig = useMemo(() => {
    return {
      swaps: isSolverProduction ? productionSolverConfig : stagingSolverConfig,
    } satisfies SodaxConfig;
  }, [isSolverProduction]);

  return (
    <SodaxProvider testnet={false} config={sodaxConfig} rpcConfig={rpcConfig}>
      <QueryClientProvider client={queryClient}>
        <SodaxWalletProvider rpcConfig={rpcConfig}>{children}</SodaxWalletProvider>
      </QueryClientProvider>
    </SodaxProvider>
  );
}
