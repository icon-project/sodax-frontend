'use client';

import type { ReactNode } from 'react';

import type { SodaxWalletConfig } from './types/config';
import { WalletConfigProvider } from './context/WalletConfigContext';
import { EvmProvider } from './providers/evm';
import { SolanaProvider } from './providers/solana';
import { SuiProvider } from './providers/sui';
import { useInitChainServices } from './hooks/useInitChainServices';
import { useStacksHydration } from './hooks/useStacksHydration';

export type SodaxWalletProviderProps = {
  children: ReactNode;
  config: SodaxWalletConfig;
};

export const SodaxWalletProvider = ({ children, config }: SodaxWalletProviderProps) => {
  const { chains, rpcConfig } = config;

  // Initialize chain services + register non-provider ChainActions + reconnect
  useInitChainServices(chains, rpcConfig);

  // Hydrate Stacks network
  useStacksHydration(chains, rpcConfig);

  // Compose providers conditionally
  let content = <>{children}</>;

  if (chains.SOLANA) {
    content = (
      <SolanaProvider config={chains.SOLANA} rpcConfig={rpcConfig}>
        {content}
      </SolanaProvider>
    );
  }

  if (chains.SUI) {
    content = (
      <SuiProvider config={chains.SUI} rpcConfig={rpcConfig}>
        {content}
      </SuiProvider>
    );
  }

  if (chains.EVM) {
    content = (
      <EvmProvider config={chains.EVM} rpcConfig={rpcConfig}>
        {content}
      </EvmProvider>
    );
  }

  return <WalletConfigProvider value={config}>{content}</WalletConfigProvider>;
};
