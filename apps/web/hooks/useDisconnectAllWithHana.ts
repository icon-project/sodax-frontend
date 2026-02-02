// apps/web/hooks/useDisconnectAllWithHana.ts
// Hook to disconnect all supported chains using Hana wallet

import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useXDisconnect, useXAccounts } from '@sodax/wallet-sdk-react';
import type { ChainType } from '@sodax/types';

type DisconnectAllResult = {
  successful: ChainType[];
  failed: { chainType: ChainType; error: Error }[];
};

const HANA_SUPPORTED_CHAINS: ChainType[] = ['EVM', 'ICON', 'SOLANA', 'SUI', 'STELLAR'];

/**
 * Hook to disconnect all supported chains.
 *
 * @returns Object with:
 *   - disconnectAll: Function to disconnect all chains
 *   - isPending: Boolean indicating if disconnection is in progress
 *   - isAllConnected: Boolean indicating if all chains are connected
 */
export function useDisconnectAllWithHana(): {
  disconnectAll: () => Promise<DisconnectAllResult>;
  isPending: boolean;
  isAllConnected: boolean;
} {
  const xAccounts = useXAccounts();
  const disconnect = useXDisconnect();

  // Check if all Hana-supported chains are connected
  const isAllConnected = HANA_SUPPORTED_CHAINS.every(chainType => {
    const account = xAccounts[chainType];
    return !!account?.address;
  });

  const mutation = useMutation({
    mutationFn: async (): Promise<DisconnectAllResult> => {
      const successful: ChainType[] = [];
      const failed: { chainType: ChainType; error: Error }[] = [];

      for (const chainType of HANA_SUPPORTED_CHAINS) {
        const account = xAccounts[chainType];

        // Skip chains that aren't connected
        if (!account?.address) {
          continue;
        }

        try {
          await disconnect(chainType);
          successful.push(chainType);
        } catch (error) {
          failed.push({
            chainType,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }

      return { successful, failed };
    },
  });

  const disconnectAll = useCallback(async (): Promise<DisconnectAllResult> => {
    return mutation.mutateAsync();
  }, [mutation]);

  return {
    disconnectAll,
    isPending: mutation.isPending,
    isAllConnected,
  };
}
