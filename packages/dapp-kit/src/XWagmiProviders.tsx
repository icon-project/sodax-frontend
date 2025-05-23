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
import type { XConfig } from './types';
import { initXWagmiStore } from './useXWagmiStore';

export const XWagmiProviders = ({ children, config }: { children: React.ReactNode; config: XConfig }) => {
  useEffect(() => {
    initXWagmiStore(config);
  }, [config]);

  const {
    EVM: { wagmiConfig },
    SOLANA: { endpoint },
  } = config;

  const wallets = useMemo(() => [new UnsafeBurnerWalletAdapter()], []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <SuiClientProvider networks={{ mainnet: { url: getFullnodeUrl('mainnet') } }} defaultNetwork="mainnet">
        <SuiWalletProvider autoConnect={true}>
          <SolanaConnectionProvider endpoint={endpoint}>
            <SolanaWalletProvider wallets={wallets} autoConnect>
              {children}
            </SolanaWalletProvider>
          </SolanaConnectionProvider>
        </SuiWalletProvider>
      </SuiClientProvider>
    </WagmiProvider>
  );
};
