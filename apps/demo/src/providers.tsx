import React, { useMemo, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { XWagmiProviders } from '@sodax/wallet-sdk';
import { SodaxProvider, type RpcConfig } from '@sodax/dapp-kit';
import { productionSolverConfig, stagingSolverConfig, sodaxConfig } from './constants';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
} from '@sodax/types';
import type { SodaxConfig } from '@sodax/sdk';
import { useAppStore } from './zustand/useAppStore';

const queryClient = new QueryClient();

const rpcConfig: RpcConfig = {
  //solana
  solana: 'https://solana-mainnet.g.alchemy.com/v2/i3q5fE3cYSFBE4Lcg1kS5',
};

export default function Providers({ children }: { children: ReactNode }) {
  const { isSolverProduction } = useAppStore();

  const _sodaxConfig = useMemo(() => {
    return {
      ...sodaxConfig,
      solver: isSolverProduction ? productionSolverConfig : stagingSolverConfig,
    } satisfies SodaxConfig;
  }, [isSolverProduction]);

  return (
    <SodaxProvider testnet={false} config={_sodaxConfig} rpcConfig={rpcConfig}>
      <QueryClientProvider client={queryClient}>
        <XWagmiProviders
          config={{
            EVM: {
              chains: [
                ARBITRUM_MAINNET_CHAIN_ID,
                AVALANCHE_MAINNET_CHAIN_ID,
                BASE_MAINNET_CHAIN_ID,
                BSC_MAINNET_CHAIN_ID,
                OPTIMISM_MAINNET_CHAIN_ID,
                POLYGON_MAINNET_CHAIN_ID,
                SONIC_MAINNET_CHAIN_ID,
              ],
            },
            SUI: {
              isMainnet: true,
            },
            SOLANA: {
              endpoint: 'https://solana-mainnet.g.alchemy.com/v2/i3q5fE3cYSFBE4Lcg1kS5',
            },
            ICON: {},
            INJECTIVE: {},
            STELLAR: {},
          }}
        >
          {children}
        </XWagmiProviders>
      </QueryClientProvider>
    </SodaxProvider>
  );
}
