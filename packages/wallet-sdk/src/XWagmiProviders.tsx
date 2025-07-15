'use client';

// biome-ignore lint/style/useImportType: <explanation>
import React from 'react';
import { useEffect, useMemo } from 'react';

// sui
import { SuiClientProvider, WalletProvider as SuiWalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';

// evm
import { createConfig, http, type Transport, WagmiProvider } from 'wagmi';
import { mainnet, avalanche, base, optimism, polygon, arbitrum, bsc, sonicBlazeTestnet } from 'wagmi/chains';

// solana
import {
  ConnectionProvider as SolanaConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import type { XConfig } from './types';
import { initXWagmiStore, InitXWagmiStore } from './useXWagmiStore';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
} from '@sodax/types';

const evmChainMap = {
  [AVALANCHE_MAINNET_CHAIN_ID]: avalanche,
  [ARBITRUM_MAINNET_CHAIN_ID]: arbitrum,
  [BASE_MAINNET_CHAIN_ID]: base,
  [BSC_MAINNET_CHAIN_ID]: bsc,
  [SONIC_MAINNET_CHAIN_ID]: sonicBlazeTestnet,
  [OPTIMISM_MAINNET_CHAIN_ID]: optimism,
  [POLYGON_MAINNET_CHAIN_ID]: polygon,
};

type EvmChainId = keyof typeof evmChainMap;

export const XWagmiProviders = ({ children, config }: { children: React.ReactNode; config: XConfig }) => {
  useEffect(() => {
    initXWagmiStore(config);
  }, [config]);

  const {
    EVM: { chains },
    SOLANA: { endpoint },
  } = config;

  const wallets = useMemo(() => [new UnsafeBurnerWalletAdapter()], []);

  const wagmiConfig = useMemo(() => {
    const mappedChains = chains.map(chain => evmChainMap[chain as EvmChainId]);
    const finalChains = mappedChains.length > 0 ? mappedChains : [mainnet];

    const transports = finalChains.reduce(
      (acc, chain) => {
        acc[chain.id] = http();
        return acc;
      },
      {} as Record<number, Transport>,
    );

    return createConfig({
      chains: finalChains as [typeof mainnet, ...(typeof mainnet)[]],
      transports,
    });
  }, [chains]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <SuiClientProvider networks={{ mainnet: { url: getFullnodeUrl('mainnet') } }} defaultNetwork="mainnet">
        <SuiWalletProvider autoConnect={true}>
          <SolanaConnectionProvider endpoint={endpoint}>
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
