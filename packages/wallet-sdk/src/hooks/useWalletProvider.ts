import type { ChainId } from '@sodax/types';
import { useMemo } from 'react';
import { EvmWalletProvider, IconWalletProvider, SuiWalletProvider, InjectiveWalletProvider } from '../wallet-providers';
import { getXChainType } from '../actions';
import { useWalletProviderOptions } from './useWalletProviderOptions';
import type { Account, Chain, CustomTransport, HttpTransport, WalletClient, PublicClient } from 'viem';
import type { IconEoaAddress } from '../wallet-providers/IconWalletProvider';
import type { InjectiveEoaAddress } from '@sodax/types';
/**
 * Hook to get the appropriate wallet provider based on the chain type.
 * Supports EVM, SUI, ICON and INJECTIVE chains.
 *
 * @param {ChainId | undefined} spokeChainId - The chain ID to get the wallet provider for. Can be any valid ChainId value.
 * @returns {EvmWalletProvider | SuiWalletProvider | IconWalletProvider | InjectiveWalletProvider | undefined}
 * The appropriate wallet provider instance for the given chain ID, or undefined if:
 * - No chain ID is provided
 * - Chain type is not supported
 * - Required wallet provider options are not available
 *
 * @example
 * ```tsx
 * // Get wallet provider for a specific chain
 * const walletProvider = useWalletProvider('sui');
 * ```
 */

export function useWalletProvider(
  spokeChainId: ChainId | undefined,
): EvmWalletProvider | SuiWalletProvider | IconWalletProvider | InjectiveWalletProvider | undefined {
  const xChainType = getXChainType(spokeChainId);
  const walletProviderOptions = useWalletProviderOptions(spokeChainId);

  return useMemo(() => {
    if (!walletProviderOptions) {
      return undefined;
    }

    if (!xChainType) {
      return undefined;
    }

    switch (xChainType) {
      case 'EVM': {
        const { walletClient, publicClient } = walletProviderOptions as {
          walletClient: WalletClient<CustomTransport | HttpTransport, Chain, Account> | undefined;
          publicClient: PublicClient<CustomTransport | HttpTransport>;
        };

        return new EvmWalletProvider({ walletClient, publicClient });
      }

      case 'SUI': {
        const { client, wallet, account } = walletProviderOptions;

        return new SuiWalletProvider({ client, wallet, account });
      }

      case 'ICON': {
        const { walletAddress, rpcUrl } = walletProviderOptions;

        return new IconWalletProvider({
          walletAddress: walletAddress as IconEoaAddress | undefined,
          rpcUrl: rpcUrl as `http${string}`,
        });
      }

      case 'INJECTIVE': {
        const { walletAddress, client, rpcUrl } = walletProviderOptions;
        return new InjectiveWalletProvider({
          walletAddress: walletAddress as InjectiveEoaAddress | undefined,
          client: client,
          rpcUrl: rpcUrl as string,
        });
      }

      default:
        return undefined;
    }
  }, [xChainType, walletProviderOptions]);
}
