import type { XChainType } from '@/types';
import { useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { useAccount, useConnections } from 'wagmi';
import type { XConnection } from '../types';
import { useXWagmiStore } from '../useXWagmiStore';

/**
 * Hook for accessing connection details for a specific blockchain
 *
 * Retrieves the current connection state for the specified chain type,
 * including the connected account and connector ID.
 *
 * @param {XChainType} xChainType - The type of blockchain to get connection details for
 * @returns {XConnection | undefined} Connection details including account and connector ID, or undefined if not connected
 *
 * @example
 * ```ts
 * const connection = useXConnection('EVM');
 *
 * if (connection) {
 *   console.log('Connected account:', connection.xAccount.address);
 *   console.log('Using connector:', connection.xConnectorId);
 * }
 * ```
 */
export function useXConnection(xChainType: XChainType | undefined): XConnection | undefined {
  const xConnection = useXWagmiStore(state => (xChainType ? state.xConnections?.[xChainType] : undefined));

  const evmConnections = useConnections();
  const { address: evmAddress } = useAccount();
  const suiAccount = useCurrentAccount();
  const suiCurrentWallet = useCurrentWallet();
  const solanaWallet = useWallet();

  const xConnection2 = useMemo(() => {
    if (!xChainType) {
      return undefined;
    }

    switch (xChainType) {
      case 'EVM':
        return {
          xAccount: { address: evmAddress as string, xChainType },
          xConnectorId: evmConnections?.[0]?.connector.id,
        };
      case 'SUI':
        if (suiCurrentWallet.currentWallet && suiCurrentWallet.connectionStatus === 'connected') {
          return {
            xAccount: { address: suiAccount?.address, xChainType },
            xConnectorId: suiCurrentWallet.currentWallet.name,
          };
        }
        return undefined;

      case 'SOLANA':
        if (solanaWallet.connected) {
          return {
            xAccount: { address: solanaWallet.publicKey?.toString(), xChainType },
            xConnectorId: `${solanaWallet.wallet?.adapter.name}`,
          };
        }
        return undefined;
      default:
        return xConnection;
    }
  }, [xChainType, xConnection, evmAddress, suiAccount, evmConnections, suiCurrentWallet, solanaWallet]);

  return xConnection2;
}
