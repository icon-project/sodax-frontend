'use client';

// biome-ignore lint/style/useImportType: <explanation>
import React, { useMemo } from 'react';

// sui
import { SuiClientProvider, WalletProvider as SuiWalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';

// evm
import { WagmiProvider } from 'wagmi';

// solana
import {
  ConnectionProvider as SolanaConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';

import type { RpcConfig } from '@sodax/types';

import { Hydrate } from './Hydrate';
import { createWagmiConfig } from './xchains/evm/EvmXService';
import { reconnectIcon } from './xchains/icon/actions';
import { reconnectStellar } from './xchains/stellar/actions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export type SodaxWalletProviderOptions = {
  wagmi?: {
    reconnectOnMount?: boolean;
    ssr?: boolean;
  };
  solana?: {
    autoConnect?: boolean;
  };
  sui?: {
    autoConnect?: boolean;
  };
}

const defaultOptions = {
  wagmi: {
    reconnectOnMount: false,
    ssr: true,
  },
  solana: {
    autoConnect: true,
  },
  sui: {
    autoConnect: true,
  },
} satisfies SodaxWalletProviderOptions;

export type SodaxWalletProviderProps = {
  children: React.ReactNode;
  rpcConfig: RpcConfig;
  options?: SodaxWalletProviderOptions;
};

export const SodaxWalletProvider = ({ children, rpcConfig, options }: SodaxWalletProviderProps) => {
  const wagmiConfig = useMemo(() => {
    return createWagmiConfig(rpcConfig);
  }, [rpcConfig]);

  const wallets = useMemo(() => [new UnsafeBurnerWalletAdapter()], []);
  const wagmi = { ...defaultOptions.wagmi, ...options?.wagmi };
  const solana = { ...defaultOptions.solana, ...options?.solana };
  const sui = { ...defaultOptions.sui, ...options?.sui };

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider reconnectOnMount={wagmi.reconnectOnMount} config={wagmiConfig}>
        <SuiClientProvider networks={{ mainnet: { url: getFullnodeUrl('mainnet') } }} defaultNetwork="mainnet">
          <SuiWalletProvider autoConnect={sui.autoConnect}>
            <SolanaConnectionProvider endpoint={rpcConfig['solana'] ?? 'https://api.mainnet-beta.solana.com'}>
              <SolanaWalletProvider wallets={wallets} autoConnect={solana.autoConnect}>
                <Hydrate rpcConfig={rpcConfig} />
                {children}
              </SolanaWalletProvider>
            </SolanaConnectionProvider>
          </SuiWalletProvider>
        </SuiClientProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

reconnectIcon();
// reconnectInjective();
reconnectStellar();
