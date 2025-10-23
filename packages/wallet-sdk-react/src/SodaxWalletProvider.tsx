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
// import { reconnectInjective } from './xchains/injective/actions';
import { reconnectStellar } from './xchains/stellar/actions';

export const SodaxWalletProvider = ({ children, rpcConfig }: { children: React.ReactNode; rpcConfig: RpcConfig }) => {
  const wagmiConfig = useMemo(() => {
    return createWagmiConfig(rpcConfig);
  }, [rpcConfig]);

  const wallets = useMemo(() => [new UnsafeBurnerWalletAdapter()], []);

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
      <SuiClientProvider networks={{ mainnet: { url: getFullnodeUrl('mainnet') } }} defaultNetwork="mainnet">
        <SuiWalletProvider autoConnect={true}>
          <SolanaConnectionProvider endpoint={rpcConfig['solana'] ?? ''}>
            <SolanaWalletProvider wallets={wallets} autoConnect>
              <Hydrate />
              {children}
            </SolanaWalletProvider>
          </SolanaConnectionProvider>
        </SuiWalletProvider>
      </SuiClientProvider>
    </WagmiProvider>
  );
};

reconnectIcon();
// reconnectInjective();
reconnectStellar();
