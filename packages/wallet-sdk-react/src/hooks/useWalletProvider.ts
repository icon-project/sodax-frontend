import type { SpokeChainKey, ChainType } from '@sodax/types';
import { getXChainType } from '../actions/index.js';
import { useXWalletStore } from '../useXWalletStore.js';
import type { WalletProvider } from '../types/index.js';

const warnedChains = new Set<ChainType>();

/**
 * Hook to get the appropriate wallet provider based on the chain type.
 * Reads from the centralized store — wallet providers are hydrated by per-chain providers (EVM, Solana, Sui)
 * or created on connection for non-provider chains (Bitcoin, ICON, Injective, Stellar, NEAR, Stacks).
 *
 * Logs a one-time warning per chain if the requested chain is not enabled in
 * SodaxWalletProvider config.chains. Returns undefined silently if the chain
 * is enabled but no wallet is connected yet (normal pre-connect state).
 */
export function useWalletProvider(spokeChainId: SpokeChainKey | undefined): WalletProvider | undefined {
  const xChainType = getXChainType(spokeChainId);
  return useXWalletStore(state => {
    if (!xChainType) return undefined;
    if (!state.enabledChains.includes(xChainType) && !warnedChains.has(xChainType)) {
      warnedChains.add(xChainType);
      console.warn(
        `[useWalletProvider] chain "${xChainType}" is not enabled in SodaxWalletProvider config.chains — returning undefined`,
      );
    }
    return state.walletProviders[xChainType];
  });
}
