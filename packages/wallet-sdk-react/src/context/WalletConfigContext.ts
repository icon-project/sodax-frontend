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

/**
 * A chain is "enabled" only when its config value is truthy.
 * `chainType in chains` would also match `{ EVM: undefined }` — value-truthy check
 * matches the intent: omit a chain (or set it to undefined) to disable it.
 */
export function useIsChainEnabled(chainType: ChainType): boolean {
  const { chains } = useWalletConfig();
  return !!chains[chainType];
}

/** See {@link useIsChainEnabled} for the "enabled" semantic. */
export function useEnabledChainTypes(): ChainType[] {
  const { chains } = useWalletConfig();
  return ChainTypeArr.filter(t => !!chains[t]);
}

export function useChainsConfig(): ChainsConfig {
  const { chains } = useWalletConfig();
  return chains;
}
