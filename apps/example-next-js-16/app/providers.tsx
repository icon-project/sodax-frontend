'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SodaxWalletProvider } from '@sodax/wallet-sdk-react';
import { SodaxProvider } from '@sodax/dapp-kit';
import * as SDK from '@sodax/sdk';
import * as Types from '@sodax/types';
import type { State as WagmiState } from 'wagmi';

const queryClient = new QueryClient();

const sodaxConfig: SDK.SodaxConfig = {
  hubProviderConfig: {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: SDK.getHubChainConfig(),
  },
  moneyMarket: SDK.getMoneyMarketConfig(Types.SONIC_MAINNET_CHAIN_ID),
  swaps: {
    intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
    solverApiEndpoint: 'https://api.sodax.com/v1/intent',
  },
};

const rpcConfig: Types.RpcConfig = {
  sonic: 'https://rpc.soniclabs.com',
  '0x1.icon': 'https://ctz.solidwallet.io/api/v3',
  solana: 'https://solana-rpc.publicnode.com',
};

export default function Providers({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: WagmiState;
}) {
  return (
    <SodaxProvider testnet={false} config={sodaxConfig} rpcConfig={rpcConfig}>
      <QueryClientProvider client={queryClient}>
        <SodaxWalletProvider
          rpcConfig={rpcConfig}
          options={{ wagmi: { ssr: true, reconnectOnMount: true } }}
          initialState={initialState}
        >
          {children}
        </SodaxWalletProvider>
      </QueryClientProvider>
    </SodaxProvider>
  );
}
