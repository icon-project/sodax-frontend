import type { ChainId } from '@sodax/types';
import { getXChainType } from '../actions';
import { useXWalletStore } from '../useXWalletStore';
import type { WalletProvider } from '../types';

/**
 * Hook to get the appropriate wallet provider based on the chain type.
 * Reads from the centralized store — wallet providers are hydrated by per-chain providers (EVM, Solana, Sui)
 * or created on connection for non-provider chains (Bitcoin, ICON, Injective, Stellar, NEAR, Stacks).
 */
export function useWalletProvider(spokeChainId: ChainId | undefined): WalletProvider | undefined {
  const xChainType = getXChainType(spokeChainId);
  return useXWalletStore(state => (xChainType ? state.walletProviders[xChainType] : undefined));
}
