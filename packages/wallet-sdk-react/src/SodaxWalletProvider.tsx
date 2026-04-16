'use client';

import type { ReactNode } from 'react';

import type { SodaxWalletConfig } from './types/config.js';
import { WalletConfigProvider } from './context/WalletConfigContext.js';
import { EvmProvider } from './providers/evm/index.js';
import { SolanaProvider } from './providers/solana/index.js';
import { SuiProvider } from './providers/sui/index.js';
import { useInitChainServices } from './hooks/useInitChainServices.js';
import { useStacksHydration } from './hooks/useStacksHydration.js';

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
