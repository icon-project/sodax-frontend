import { createContext, useContext } from 'react';
import type { ChainType } from '@sodax/types';
import type { ChainsConfig, SodaxWalletConfig } from '../types';

const WalletConfigContext = createContext<SodaxWalletConfig | null>(null);

export const WalletConfigProvider = WalletConfigContext.Provider;

export function useWalletConfig(): SodaxWalletConfig {
  const config = useContext(WalletConfigContext);
  if (!config) {
    throw new Error('useWalletConfig must be used within SodaxWalletProvider');
  }
  return config;
}

export function useIsChainEnabled(chainType: ChainType): boolean {
  const { chains } = useWalletConfig();
  return chainType in chains;
}

export function useEnabledChainTypes(): ChainType[] {
  const { chains } = useWalletConfig();
  return Object.keys(chains) as ChainType[];
}

export function useChainsConfig(): ChainsConfig {
  const { chains } = useWalletConfig();
  return chains;
}
