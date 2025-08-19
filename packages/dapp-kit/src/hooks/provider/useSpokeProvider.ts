import { useSodaxContext } from '@/index';
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
  SONIC_MAINNET_CHAIN_ID,
  SonicSpokeProvider,
  type SonicSpokeChainConfig,
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
  const { rpcConfig } = useSodaxContext();
  const xChainType = spokeChainId ? spokeChainConfig[spokeChainId]?.chain.type : undefined;

  const spokeProvider = useMemo(() => {
    if (!walletProvider) return undefined;
    if (!spokeChainId) return undefined;
    if (!xChainType) return undefined;
    if (!rpcConfig) return undefined;

    if (xChainType === 'EVM') {
      if (spokeChainId === SONIC_MAINNET_CHAIN_ID) {
        return new SonicSpokeProvider(
          walletProvider as IEvmWalletProvider,
          spokeChainConfig[spokeChainId] as SonicSpokeChainConfig,
        );
      }
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
      return new InjectiveSpokeProvider(
        spokeChainConfig[spokeChainId] as InjectiveSpokeChainConfig,
        walletProvider as IInjectiveWalletProvider,
      );
    }

    if (xChainType === 'STELLAR') {
      const stellarConfig = spokeChainConfig[spokeChainId] as StellarSpokeChainConfig;
      return new StellarSpokeProvider(walletProvider as IStellarWalletProvider, stellarConfig, {
        horizonRpcUrl: stellarConfig.horizonRpcUrl,
        sorobanRpcUrl: stellarConfig.sorobanRpcUrl,
      });
    }

    if (xChainType === 'SOLANA') {
      return new SolanaSpokeProvider(
        walletProvider as ISolanaWalletProvider,
        rpcConfig.solana
          ? ({
              ...spokeChainConfig[spokeChainId],
              rpcUrl: rpcConfig.solana,
            } as SolanaChainConfig)
          : (spokeChainConfig[spokeChainId] as SolanaChainConfig),
      );
    }

    return undefined;
  }, [spokeChainId, xChainType, walletProvider, rpcConfig]);

  return spokeProvider;
}
