'use client';

import React, { useMemo, type ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { SodaxWalletProvider } from '@sodax/wallet-sdk-react';
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
import { getQueryClient } from '@/app/get-query-client';
import { XConfig } from '@sodax/wallet-sdk-react';

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  const sodaxWalletConfig = useMemo(() => {
    return {
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
      ICON: undefined as unknown,
      INJECTIVE: undefined as unknown,
      STELLAR: undefined as unknown,
    } satisfies XConfig;
  }, []);


  return (
    <SodaxProvider testnet={false} config={sodaxConfig} rpcConfig={rpcConfig}>
      <QueryClientProvider client={queryClient}>
      <SodaxWalletProvider config={sodaxWalletConfig}>{children}</SodaxWalletProvider>
      </QueryClientProvider>
    </SodaxProvider>
  );
}
