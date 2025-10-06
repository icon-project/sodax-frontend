import React, { useMemo, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SodaxWalletProvider } from '@sodax/wallet-sdk-react';
import { type RpcConfig, SodaxProvider } from '@sodax/dapp-kit';
import { productionSolverConfig, stagingSolverConfig } from './constants';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  HYPEREVM_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
} from '@sodax/types';
import type { SodaxConfig } from '@sodax/sdk';
import { useAppStore } from './zustand/useAppStore';

const queryClient = new QueryClient();

const rpcConfig: RpcConfig = {
  //solana
  solana: 'https://solana-mainnet.g.alchemy.com/v2/i3q5fE3cYSFBE4Lcg1kS5',
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
      solver: isSolverProduction ? productionSolverConfig : stagingSolverConfig,
    } satisfies SodaxConfig;
  }, [isSolverProduction]);

  return (
    <SodaxProvider testnet={false} config={sodaxConfig} rpcConfig={rpcConfig}>
      <QueryClientProvider client={queryClient}>
        <SodaxWalletProvider
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
                HYPEREVM_MAINNET_CHAIN_ID,
                LIGHTLINK_MAINNET_CHAIN_ID,
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
            NEAR:{},
          }}
        >
          {children}
        </SodaxWalletProvider>
      </QueryClientProvider>
    </SodaxProvider>
  );
}
