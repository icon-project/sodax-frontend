import type {
  ChainId,
  IEvmWalletProvider,
  IIconWalletProvider,
  IInjectiveWalletProvider,
  ISolanaWalletProvider,
  IStellarWalletProvider,
  ISuiWalletProvider,
} from '@sodax/types';
import { useMemo } from 'react';
import {
  EvmWalletProvider,
  IconWalletProvider,
  SuiWalletProvider,
  InjectiveWalletProvider,
  StellarWalletProvider,
  SolanaWalletProvider,
} from '@sodax/wallet-sdk-core';
import { getXChainType } from '../actions';
import { usePublicClient, useWalletClient } from 'wagmi';
import { type SolanaXService, type StellarXService, useXAccount, useXService } from '..';
import type { SuiXService } from '../xchains/sui/SuiXService';
import { CHAIN_INFO, SupportedChainId } from '../xchains/icon/IconXService';
import type { InjectiveXService } from '../xchains/injective/InjectiveXService';

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
):
  | IEvmWalletProvider
  | ISuiWalletProvider
  | IIconWalletProvider
  | IInjectiveWalletProvider
  | IStellarWalletProvider
  | ISolanaWalletProvider
  | undefined {
  const xChainType = getXChainType(spokeChainId);
  // EVM-specific hooks
  const evmPublicClient = usePublicClient();

  const { data: evmWalletClient } = useWalletClient();

  // Cross-chain hooks
  const xService = useXService(getXChainType(spokeChainId));
  const xAccount = useXAccount(spokeChainId);

  return useMemo(() => {
    switch (xChainType) {
      case 'EVM': {
        if (!evmWalletClient) {
          return undefined;
        }
        if (!evmPublicClient) {
          return undefined;
        }

        return new EvmWalletProvider({
          walletClient: evmWalletClient,
          publicClient: evmPublicClient,
        });
      }

      case 'SUI': {
        const suiXService = xService as SuiXService;
        const { client, wallet, account } = {
          client: suiXService.suiClient,
          wallet: suiXService.suiWallet,
          account: suiXService.suiAccount,
        };

        return new SuiWalletProvider({ client, wallet, account });
      }

      case 'ICON': {
        const { walletAddress, rpcUrl } = {
          walletAddress: xAccount.address,
          rpcUrl: CHAIN_INFO[SupportedChainId.MAINNET].APIEndpoint,
        };

        return new IconWalletProvider({
          walletAddress: walletAddress as `hx${string}` | undefined,
          rpcUrl: rpcUrl as `http${string}`,
        });
      }

      case 'INJECTIVE': {
        const injectiveXService = xService as InjectiveXService;
        if (!injectiveXService) {
          return undefined;
          // throw new Error('InjectiveXService is not initialized');
        }

        return new InjectiveWalletProvider({
          msgBroadcaster: injectiveXService.msgBroadcaster,
        });
      }

      case 'STELLAR': {
        const stellarXService = xService as StellarXService;
        if (!stellarXService.walletsKit) {
          return undefined;
        }

        return new StellarWalletProvider({
          type: 'BROWSER_EXTENSION',
          walletsKit: stellarXService.walletsKit,
          network: 'PUBLIC',
        });
      }

      case 'SOLANA': {
        const solanaXService = xService as SolanaXService;

        if (!solanaXService.wallet) {
          throw new Error('Wallet is not initialized');
        }

        if (!solanaXService.connection) {
          throw new Error('Connection is not initialized');
        }

        return new SolanaWalletProvider({
          wallet: solanaXService.wallet,
          connection: solanaXService.connection,
        });
      }

      default:
        return undefined;
    }
  }, [xChainType, evmPublicClient, evmWalletClient, xService, xAccount]);
}
