// apps/web/hooks/useConnectAllWithHana.ts
// Hook to connect all supported chains using Hana wallet

import { useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useXConnectors, useXConnect, type XConnector } from '@sodax/wallet-sdk-react';
import type { ChainType } from '@sodax/types';

type ConnectAllResult = {
  successful: ChainType[];
  failed: { chainType: ChainType; error: Error }[];
};

const HANA_SUPPORTED_CHAINS: ChainType[] = ['EVM', 'ICON', 'SOLANA', 'SUI', 'STELLAR'];

/**
 * Finds the Hana connector from a list of connectors.
 * Matches by name containing 'hana' (case-insensitive).
 */
function findHanaConnector(connectors: XConnector[]): XConnector | undefined {
  return connectors.find(connector => connector.name.toLowerCase().includes('hana'));
}

/**
 * Hook to connect all supported chains using Hana wallet.
 *
 * @returns Object with:
 *   - connectAll: Function to connect all chains
 *   - isPending: Boolean indicating if connection is in progress
 *   - hanaConnectors: Map of chain types to their Hana connectors
 */
export function useConnectAllWithHana(): {
  connectAll: () => Promise<ConnectAllResult>;
  isPending: boolean;
  hanaConnectors: Map<ChainType, XConnector | undefined>;
} {
  const evmConnectors = useXConnectors('EVM');
  const iconConnectors = useXConnectors('ICON');
  const solanaConnectors = useXConnectors('SOLANA');
  const suiConnectors = useXConnectors('SUI');
  const stellarConnectors = useXConnectors('STELLAR');

  const { mutateAsync: connect } = useXConnect();

  const hanaConnectors = useMemo(() => {
    const map = new Map<ChainType, XConnector | undefined>();
    map.set('EVM', findHanaConnector(evmConnectors));
    map.set('ICON', findHanaConnector(iconConnectors));
    map.set('SOLANA', findHanaConnector(solanaConnectors));
    map.set('SUI', findHanaConnector(suiConnectors));
    map.set('STELLAR', findHanaConnector(stellarConnectors));
    return map;
  }, [evmConnectors, iconConnectors, solanaConnectors, suiConnectors, stellarConnectors]);

  const mutation = useMutation({
    mutationFn: async (): Promise<ConnectAllResult> => {
      const successful: ChainType[] = [];
      const failed: { chainType: ChainType; error: Error }[] = [];

      for (const chainType of HANA_SUPPORTED_CHAINS) {
        const hanaConnector = hanaConnectors.get(chainType);

        if (!hanaConnector) {
          failed.push({
            chainType,
            error: new Error(`Hana connector not found for ${chainType}`),
          });
          continue;
        }

        try {
          await connect(hanaConnector);
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

  const connectAll = useCallback(async (): Promise<ConnectAllResult> => {
    return mutation.mutateAsync();
  }, [mutation]);

  return {
    connectAll,
    isPending: mutation.isPending,
    hanaConnectors,
  };
}
