import type {
  ChainId,
  IEvmWalletProvider,
  IIconWalletProvider,
  IInjectiveWalletProvider,
  INearWalletProvider,
  ISolanaWalletProvider,
  IStacksWalletProvider,
  IStellarWalletProvider,
  ISuiWalletProvider,
  IBitcoinWalletProvider,
} from '@sodax/types';
import { useMemo } from 'react';
import { BitcoinXService } from '../xchains/bitcoin/BitcoinXService';
import type { BitcoinXConnector } from '../xchains/bitcoin/BitcoinXConnector';
import {
  EvmWalletProvider,
  IconWalletProvider,
  SuiWalletProvider,
  InjectiveWalletProvider,
  StellarWalletProvider,
  SolanaWalletProvider,
  NearWalletProvider,
  StacksWalletProvider,
} from '@sodax/wallet-sdk-core';
import { getXChainType } from '../actions';
import { usePublicClient, useWalletClient } from 'wagmi';
import { type SolanaXService, type StellarXService, useXAccount, useXService } from '..';
import type { SuiXService } from '../xchains/sui/SuiXService';
import { CHAIN_INFO, SupportedChainId } from '../xchains/icon/IconXService';
import type { InjectiveXService } from '../xchains/injective/InjectiveXService';
import type { NearXService } from '../xchains/near/NearXService';
import { useXConnection } from './useXConnection';
import { useXConnectors } from './useXConnectors';
import type { StacksXConnector } from '../xchains/stacks';

/**
 * Hook to get the appropriate wallet provider based on the chain type.
 *
 * NOTE: This hook still calls wagmi hooks (usePublicClient, useWalletClient) unconditionally.
 * It requires WagmiProvider to be mounted. When EVM is disabled and WagmiProvider is not mounted,
 * this hook should not be called with EVM chain IDs.
 * Full decoupling will be addressed in a follow-up.
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
  | IBitcoinWalletProvider
  | INearWalletProvider
  | IStacksWalletProvider
  | undefined {
  const xChainType = getXChainType(spokeChainId);
  // EVM-specific hooks
  const evmPublicClient = usePublicClient();

  const { data: evmWalletClient } = useWalletClient();

  // Cross-chain hooks
  const xService = useXService(getXChainType(spokeChainId));
  const xAccount = useXAccount(spokeChainId);
  const stacksConnection = useXConnection('STACKS');
  const stacksConnectors = useXConnectors('STACKS');
  const xConnection = useXConnection(xChainType);

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
          client: suiXService?.suiClient,
          wallet: suiXService?.suiWallet,
          account: suiXService?.suiAccount,
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
        }

        return new InjectiveWalletProvider({
          msgBroadcaster: injectiveXService.msgBroadcaster,
        });
      }

      case 'STELLAR': {
        const stellarXService = xService as StellarXService;
        if (!stellarXService?.walletsKit) {
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

        if (!solanaXService?.wallet) {
          return undefined;
        }

        if (!solanaXService?.connection) {
          return undefined;
        }

        return new SolanaWalletProvider({
          wallet: solanaXService.wallet,
          endpoint: solanaXService.connection.rpcEndpoint,
        });
      }

      case 'BITCOIN': {
        if (!xConnection?.xConnectorId) return undefined;
        const connector = BitcoinXService.getInstance().getXConnectorById(xConnection.xConnectorId) as
          | BitcoinXConnector
          | undefined;
        if (!connector) return undefined;
        return connector.recreateWalletProvider(xConnection.xAccount);
      }

      case 'NEAR': {
        const nearXService = xService as NearXService;
        if (!nearXService?.walletSelector) {
          return undefined;
        }

        return new NearWalletProvider({ wallet: nearXService.walletSelector });
      }

      case 'STACKS': {
        const address = xAccount.address;
        if (!address) {
          return undefined;
        }

        const activeStacksConnector = stacksConnectors.find(c => c.id === stacksConnection?.xConnectorId) as
          | StacksXConnector
          | undefined;

        return new StacksWalletProvider({ address, provider: activeStacksConnector?.getProvider() });
      }

      default:
        return undefined;
    }
  }, [
    xChainType,
    evmPublicClient,
    evmWalletClient,
    xService,
    xAccount,
    stacksConnection,
    stacksConnectors,
    xConnection,
  ]);
}
