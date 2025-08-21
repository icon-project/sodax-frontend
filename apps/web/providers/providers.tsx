'use client';

import React, { type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { XWagmiProviders } from '@sodax/wallet-sdk';
import { SodaxProvider } from '@sodax/dapp-kit';
import { sodaxConfig, rpcConfig } from './constants';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
} from '@sodax/types';
const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SodaxProvider testnet={false} config={sodaxConfig} rpcConfig={rpcConfig}>
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
              endpoint: 'https://api.mainnet-beta.solana.com',
            },
            ICON: undefined as unknown,
            INJECTIVE: undefined as unknown,
            STELLAR: undefined as unknown,
          }}
        >
          {children}
        </XWagmiProviders>
      </QueryClientProvider>
    </SodaxProvider>
  );
}
