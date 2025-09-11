import type { ChainType } from '@sodax/types';
import { useDisconnectWallet } from '@mysten/dapp-kit';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback } from 'react';
import { useDisconnect } from 'wagmi';
import { getXService } from '../actions';
import { useXWagmiStore } from '../useXWagmiStore';

/**
 * Hook for disconnecting from a specific blockchain wallet
 *
 * Handles disconnection logic for EVM, SUI, Solana and other supported chains.
 * Clears connection state from XWagmiStore.
 *
 * @param {void} - No parameters required
 * @returns {(xChainType: ChainType) => Promise<void>} Async function that disconnects from the specified chain
 *
 * @example
 * ```ts
 * const disconnect = useXDisconnect();
 *
 * const handleDisconnect = async (xChainType: ChainType) => {
 *   await disconnect(xChainType);
 * };
 * ```
 */
export function useXDisconnect(): (xChainType: ChainType) => Promise<void> {
  // Get connection state and disconnect handler from store
  const xConnections = useXWagmiStore(state => state.xConnections);
  const unsetXConnection = useXWagmiStore(state => state.unsetXConnection);

  // Get chain-specific disconnect handlers
  const { disconnectAsync } = useDisconnect();
  const { mutateAsync: suiDisconnectAsync } = useDisconnectWallet();
  const solanaWallet = useWallet();

  return useCallback(
    async (xChainType: ChainType) => {
      // Handle disconnection based on chain type
      switch (xChainType) {
        case 'EVM':
          await disconnectAsync();
          break;
        case 'SUI':
          await suiDisconnectAsync();
          break;
        case 'SOLANA':
          await solanaWallet.disconnect();
          break;
        default: {
          // Handle other chain types
          const xService = getXService(xChainType);
          const xConnectorId = xConnections[xChainType]?.xConnectorId;
          const xConnector = xConnectorId ? xService.getXConnectorById(xConnectorId) : undefined;
          await xConnector?.disconnect();
          break;
        }
      }

      // Clear connection state from store
      unsetXConnection(xChainType);
    },
    [xConnections, unsetXConnection, disconnectAsync, suiDisconnectAsync, solanaWallet],
  );
}
