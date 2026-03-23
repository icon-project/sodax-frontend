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
import { LeoWalletAdapter } from '@provablehq/aleo-wallet-adaptor-leo';
import { DecryptPermission } from '@provablehq/aleo-wallet-adaptor-core';

import type { RpcConfig } from '@sodax/types';

import { Hydrate } from './Hydrate';
import { createWagmiConfig } from './xchains/evm/EvmXService';
import { AleoXService } from './xchains/aleo';
import { reconnectIcon } from './xchains/icon/actions';
import { reconnectStellar } from './xchains/stellar/actions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export const SodaxWalletProvider = ({ children, rpcConfig }: { children: React.ReactNode; rpcConfig: RpcConfig }) => {
  const wagmiConfig = useMemo(() => {
    return createWagmiConfig(rpcConfig);
  }, [rpcConfig]);

  useMemo(() => {
    const aleoRpcUrl = rpcConfig['aleo'];
    if (aleoRpcUrl) {
      AleoXService.getInstance().setRpcUrl(aleoRpcUrl);
    }
  }, [rpcConfig]);

  const solanaWallets = useMemo(() => [new UnsafeBurnerWalletAdapter()], []);

  const aleoWallets = useMemo(() => [new LeoWalletAdapter(), new PuzzleWalletAdapter(), new ShieldWalletAdapter()], []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider reconnectOnMount={false} config={wagmiConfig}>
        <SuiClientProvider networks={{ mainnet: { url: getFullnodeUrl('mainnet') } }} defaultNetwork="mainnet">
          <SuiWalletProvider autoConnect={true}>
            <SolanaConnectionProvider endpoint={rpcConfig['solana'] ?? 'https://api.mainnet-beta.solana.com'}>
              <SolanaWalletProvider wallets={solanaWallets} autoConnect>
                <AleoWalletProvider
                  wallets={aleoWallets}
                  autoConnect={true}
                  decryptPermission={DecryptPermission.NoDecrypt}
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
