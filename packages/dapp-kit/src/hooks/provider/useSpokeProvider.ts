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
  StellarSpokeProvider,
  type StellarSpokeChainConfig,
} from '@sodax/sdk';
import type {
  IEvmWalletProvider,
  IIconWalletProvider,
  ISuiWalletProvider,
  SpokeChainId,
  IInjectiveWalletProvider,
  IStellarWalletProvider,
} from '@sodax/types';
import { getXChainType, useWalletProvider } from '@sodax/wallet-sdk';
import { useMemo } from 'react';

export function useSpokeProvider(spokeChainId: SpokeChainId) {
  const xChainType = getXChainType(spokeChainId);
  const walletProvider = useWalletProvider(spokeChainId);
  const spokeProvider = useMemo(() => {
    if (!walletProvider) return undefined;
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

    if (xChainType === 'STELLAR') {
      return new StellarSpokeProvider(
        walletProvider as IStellarWalletProvider,
        spokeChainConfig[spokeChainId].addresses.assetManager,
        spokeChainConfig[spokeChainId] as StellarSpokeChainConfig,
        (spokeChainConfig[spokeChainId] as StellarSpokeChainConfig).rpc_url,
      );
    }

    return undefined;
  }, [walletProvider, xChainType, spokeChainId]);

  return spokeProvider;
}
