'use client';

// biome-ignore lint/style/useImportType: <explanation>
import React from 'react';
import { useEffect, useMemo } from 'react';

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
import { initXWagmiStore, InitXWagmiStore } from './useXWagmiStore';

import { createWagmiConfig } from './xchains/evm/EvmXService';

export const SodaxWalletProvider = ({ children, rpcConfig }: { children: React.ReactNode; rpcConfig: RpcConfig }) => {
  useEffect(() => {
    initXWagmiStore();
  }, []);

  const wallets = useMemo(() => [new UnsafeBurnerWalletAdapter()], []);

  const wagmiConfig = useMemo(() => {
    return createWagmiConfig(rpcConfig);
  }, [rpcConfig]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <SuiClientProvider networks={{ mainnet: { url: getFullnodeUrl('mainnet') } }} defaultNetwork="mainnet">
        <SuiWalletProvider autoConnect={true}>
          <SolanaConnectionProvider endpoint={rpcConfig['solana'] ?? ''}>
            <SolanaWalletProvider wallets={wallets} autoConnect>
              <InitXWagmiStore />
              {children}
            </SolanaWalletProvider>
          </SolanaConnectionProvider>
        </SuiWalletProvider>
      </SuiClientProvider>
    </WagmiProvider>
  );
};
