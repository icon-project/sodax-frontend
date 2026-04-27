import { createContext, useContext } from 'react';
import { ChainTypeArr, type ChainType } from '@sodax/types';
import type { ChainsConfig, SodaxWalletConfig } from '../types/config.js';

/**
 * Config-level context — answers "what did the consumer configure?" (before service init).
 * For service-level queries (is a chain's XService initialized?), use `state.enabledChains` from useXWalletStore.
 * Both sources agree in practice since they're populated from the same config at the same time.
 */
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
  return !!chains[chainType];
}

export function useEnabledChainTypes(): ChainType[] {
  const { chains } = useWalletConfig();
  return ChainTypeArr.filter(t => !!chains[t]);
}

export function useChainsConfig(): ChainsConfig {
  const { chains } = useWalletConfig();
  return chains;
}
