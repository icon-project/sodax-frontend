import {
  EvmSpokeProvider,
  spokeChainConfig,
  type SuiSpokeChainConfig,
  SuiSpokeProvider,
  type EvmSpokeChainConfig,
  IconSpokeProvider,
  type IconSpokeChainConfig,
  InjectiveSpokeProvider,
  type InjectiveSpokeChainConfig,
  StellarSpokeProvider,
  type StellarSpokeChainConfig,
  type SpokeProvider,
  type IWalletProvider,
  SolanaSpokeProvider,
  type SolanaChainConfig,
} from '@sodax/sdk';
import type {
  IEvmWalletProvider,
  IIconWalletProvider,
  ISuiWalletProvider,
  SpokeChainId,
  IInjectiveWalletProvider,
  IStellarWalletProvider,
  ISolanaWalletProvider,
} from '@sodax/types';
import { getXChainType, useWalletProvider } from '@sodax/wallet-sdk';
import { useMemo } from 'react';

/**
 * Hook to get the appropriate spoke provider based on the chain type.
 * Supports EVM, SUI, ICON and INJECTIVE chains.
 *
 * @param {SpokeChainId | undefined} spokeChainId - The spoke chain ID to get the provider for
 * @param {IWalletProvider | undefined} walletProvider - The wallet provider to use
 * @returns {SpokeProvider | undefined} The appropriate spoke provider instance for the given chain ID, or undefined if invalid/unsupported
 *
 * @example
 * ```tsx
 * // Using a specific SpokeChainId and wallet provider
 * const spokeProvider = useSpokeProvider(spokeChainId, walletProvider);
 * ```
 */
export function useSpokeProvider(
  spokeChainId: SpokeChainId | undefined,
  walletProvider?: IWalletProvider | undefined,
): SpokeProvider | undefined {
  const xChainType = getXChainType(spokeChainId);
  const walletProvider_ = useWalletProvider(spokeChainId);
  const _walletProvider = walletProvider ?? walletProvider_;

  const spokeProvider = useMemo(() => {
    if (!_walletProvider) return undefined;
    if (!spokeChainId) return undefined;

    if (xChainType === 'EVM') {
      return new EvmSpokeProvider(
        _walletProvider as IEvmWalletProvider,
        spokeChainConfig[spokeChainId] as EvmSpokeChainConfig,
      );
    }
    if (xChainType === 'SUI') {
      return new SuiSpokeProvider(
        spokeChainConfig[spokeChainId] as SuiSpokeChainConfig,
        _walletProvider as ISuiWalletProvider,
      );
    }
    if (xChainType === 'ICON') {
      return new IconSpokeProvider(
        _walletProvider as IIconWalletProvider,
        spokeChainConfig[spokeChainId] as IconSpokeChainConfig,
      );
    }
    if (xChainType === 'INJECTIVE') {
      return new InjectiveSpokeProvider(
        spokeChainConfig[spokeChainId] as InjectiveSpokeChainConfig,
        _walletProvider as IInjectiveWalletProvider,
      );
    }

    if (xChainType === 'STELLAR') {
      const stellarConfig = spokeChainConfig[spokeChainId] as StellarSpokeChainConfig;
      return new StellarSpokeProvider(_walletProvider as IStellarWalletProvider, stellarConfig, {
        horizonRpcUrl: stellarConfig.horizonRpcUrl,
        sorobanRpcUrl: stellarConfig.sorobanRpcUrl,
      });
    }

    if (xChainType === 'SOLANA') {
      return new SolanaSpokeProvider(
        _walletProvider as ISolanaWalletProvider,
        spokeChainConfig[spokeChainId] as SolanaChainConfig,
      );
    }

    return undefined;
  }, [spokeChainId, xChainType, _walletProvider]);

  return spokeProvider;
}
