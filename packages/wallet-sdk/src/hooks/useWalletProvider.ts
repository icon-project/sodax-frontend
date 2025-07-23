import type { ChainId } from '@sodax/types';
import { useMemo } from 'react';
import { EvmWalletProvider, IconWalletProvider, SuiWalletProvider, InjectiveWalletProvider } from '../wallet-providers';
import { getXChainType } from '../actions';
import type { Account, Chain, CustomTransport, HttpTransport, WalletClient, PublicClient } from 'viem';
import type { IconEoaAddress } from '../wallet-providers/IconWalletProvider';
import type { InjectiveEoaAddress } from '@sodax/types';
import { usePublicClient, useWalletClient } from 'wagmi';
import { getWagmiChainId } from '../utils';
import { type SolanaXService, type StellarXService, useXAccount, useXService } from '..';
import type { SuiXService } from '../xchains/sui/SuiXService';
import { CHAIN_INFO, SupportedChainId } from '../xchains/icon/IconXService';
import type { InjectiveXService } from '../xchains/injective/InjectiveXService';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';
import { StellarWalletProvider } from '../wallet-providers/StellarWalletProvider';
import { SolanaWalletProvider } from '../wallet-providers/SolanaWalletProvider';

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
  | EvmWalletProvider
  | SuiWalletProvider
  | IconWalletProvider
  | InjectiveWalletProvider
  | StellarWalletProvider
  | SolanaWalletProvider
  | undefined {
  const xChainType = getXChainType(spokeChainId);

  // EVM-specific hooks
  const evmPublicClient = usePublicClient({
    chainId: spokeChainId ? getWagmiChainId(spokeChainId) : undefined,
  });
  const { data: evmWalletClient } = useWalletClient({
    chainId: spokeChainId ? getWagmiChainId(spokeChainId) : undefined,
  });

  // Cross-chain hooks
  const xService = useXService(getXChainType(spokeChainId));
  const xAccount = useXAccount(spokeChainId);

  return useMemo(() => {
    switch (xChainType) {
      case 'EVM': {
        return new EvmWalletProvider({
          walletClient: evmWalletClient as WalletClient<CustomTransport | HttpTransport, Chain, Account> | undefined,
          publicClient: evmPublicClient as PublicClient<CustomTransport | HttpTransport>,
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
          walletAddress: walletAddress as IconEoaAddress | undefined,
          rpcUrl: rpcUrl as `http${string}`,
        });
      }

      case 'INJECTIVE': {
        const injectiveXService = xService as InjectiveXService;
        if (!injectiveXService) {
          return undefined;
          // throw new Error('InjectiveXService is not initialized');
        }
        const endpoints = getNetworkEndpoints(Network.Mainnet);
        const { walletAddress, client, rpcUrl } = {
          walletAddress: xAccount.address,
          client: injectiveXService.msgBroadcastClient,
          rpcUrl: endpoints.rpc,
        };

        return new InjectiveWalletProvider({
          walletAddress: walletAddress as InjectiveEoaAddress | undefined,
          client: client,
          rpcUrl: rpcUrl as string,
        });
      }

      case 'STELLAR': {
        const stellarXService = xService as StellarXService;

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
