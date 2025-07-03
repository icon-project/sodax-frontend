import {
  EvmSpokeProvider,
  spokeChainConfig,
  type SuiSpokeChainConfig,
  SuiSpokeProvider,
  type EvmSpokeChainConfig,
  IconSpokeProvider,
  type IconSpokeChainConfig,
  CWSpokeProvider,
  type CosmosSpokeChainConfig,
  type SpokeProvider,
} from '@sodax/sdk';
import type {
  IEvmWalletProvider,
  IIconWalletProvider,
  ISuiWalletProvider,
  SpokeChainId,
  IInjectiveWalletProvider,
} from '@sodax/types';
import { getXChainType, useWalletProvider } from '@sodax/wallet-sdk';
import { useMemo } from 'react';

/**
 * Hook to get the appropriate spoke provider based on the chain type.
 * Supports EVM, SUI, ICON and INJECTIVE chains.
 *
 * @param {SpokeChainId} spokeChainId - The ID of the spoke chain to get the provider for. Can be any valid SpokeChainId value.
 * @returns {SpokeProvider | undefined} The appropriate spoke provider instance for the given chain ID, or undefined if invalid/unsupported
 *
 * @example
 * ```tsx
 * // Using a specific SpokeChainId
 * const spokeProvider = useSpokeProvider('sui');
 * ```
 */
export function useSpokeProvider(spokeChainId: SpokeChainId | undefined): SpokeProvider | undefined {
  const xChainType = getXChainType(spokeChainId);
  const walletProvider = useWalletProvider(spokeChainId);
  const spokeProvider = useMemo(() => {
    if (!walletProvider || !spokeChainId) return undefined;

    if (xChainType === 'EVM') {
      return new EvmSpokeProvider(
        walletProvider as IEvmWalletProvider,
        spokeChainConfig[spokeChainId] as EvmSpokeChainConfig,
      );
    }
    if (xChainType === 'SUI') {
      return new SuiSpokeProvider(
        spokeChainConfig[spokeChainId] as SuiSpokeChainConfig,
        walletProvider as ISuiWalletProvider,
      );
    }
    if (xChainType === 'ICON') {
      return new IconSpokeProvider(
        walletProvider as IIconWalletProvider,
        spokeChainConfig[spokeChainId] as IconSpokeChainConfig,
      );
    }
    if (xChainType === 'INJECTIVE') {
      return new CWSpokeProvider(
        spokeChainConfig[spokeChainId] as CosmosSpokeChainConfig,
        walletProvider as IInjectiveWalletProvider,
      );
    }

    return undefined;
  }, [walletProvider, xChainType, spokeChainId]);

  return spokeProvider;
}
