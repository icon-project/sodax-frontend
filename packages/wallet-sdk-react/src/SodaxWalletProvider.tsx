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

// aleo
import { AleoWalletProvider } from '@provablehq/aleo-wallet-adaptor-react';
import { PuzzleWalletAdapter } from '@provablehq/aleo-wallet-adaptor-puzzle';
import { ShieldWalletAdapter } from '@provablehq/aleo-wallet-adaptor-shield';
import { DecryptPermission } from '@provablehq/aleo-wallet-adaptor-core';

import type { RpcConfig } from '@sodax/types';

import { Hydrate } from './Hydrate';
import { createWagmiConfig } from './xchains/evm/EvmXService';
import { AleoXService } from './xchains/aleo';
import { reconnectIcon } from './xchains/icon/actions';
import { reconnectStellar } from './xchains/stellar/actions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { State as WagmiState } from 'wagmi';

const queryClient = new QueryClient();

export type WagmiOptions = {
  reconnectOnMount?: boolean;
  ssr?: boolean;
};

export type SodaxWalletProviderOptions = {
  wagmi?: WagmiOptions;
  solana?: {
    autoConnect?: boolean;
  };
  sui?: {
    autoConnect?: boolean;
  };
};

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
  initialState?: WagmiState;
};

export const SodaxWalletProvider = ({ children, rpcConfig, options, initialState }: SodaxWalletProviderProps) => {
  const wagmi = useMemo(() => ({ ...defaultOptions.wagmi, ...options?.wagmi }), [options?.wagmi]);
  const wagmiConfig = useMemo(() => {
    return createWagmiConfig(rpcConfig, wagmi);
  }, [rpcConfig, wagmi]);

  useMemo(() => {
    const aleoRpcUrl = rpcConfig['aleo'];
    if (aleoRpcUrl) {
      AleoXService.getInstance().setRpcUrl(aleoRpcUrl);
    }
  }, [rpcConfig]);

  const wallets = useMemo(() => [new UnsafeBurnerWalletAdapter()], []);
  const aleoWallets = useMemo(() => [new PuzzleWalletAdapter(), new ShieldWalletAdapter()], []);
  const solana = useMemo(() => ({ ...defaultOptions.solana, ...options?.solana }), [options?.solana]);
  const sui = useMemo(() => ({ ...defaultOptions.sui, ...options?.sui }), [options?.sui]);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider reconnectOnMount={wagmi.reconnectOnMount} config={wagmiConfig} initialState={initialState}>
        <SuiClientProvider networks={{ mainnet: { url: getFullnodeUrl('mainnet') } }} defaultNetwork="mainnet">
          <SuiWalletProvider autoConnect={sui.autoConnect}>
            <SolanaConnectionProvider endpoint={rpcConfig['solana'] ?? 'https://api.mainnet-beta.solana.com'}>
              <SolanaWalletProvider wallets={wallets} autoConnect={solana.autoConnect}>
                <AleoWalletProvider
                  wallets={aleoWallets}
                  autoConnect={true}
                  decryptPermission={DecryptPermission.NoDecrypt}
                  programs={[]}
                >
                  <Hydrate rpcConfig={rpcConfig} />
                  {children}
                </AleoWalletProvider>
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