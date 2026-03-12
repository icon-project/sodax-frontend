// apps/web/hooks/useConnectRestWithHana.ts
// Hook to connect only unconnected chains using Hana wallet

import { useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useXConnectors, useXConnect, useXAccounts, type XConnector } from '@sodax/wallet-sdk-react';
import type { ChainType } from '@sodax/types';

type ConnectRestResult = {
  successful: ChainType[];
  failed: { chainType: ChainType; error: Error }[];
  skipped: ChainType[];
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
 * Hook to connect only unconnected chains using Hana wallet.
 * Skips chains that are already connected.
 *
 * @returns Object with:
 *   - connectRest: Function to connect remaining unconnected chains
 *   - isPending: Boolean indicating if connection is in progress
 *   - hanaConnectors: Map of chain types to their Hana connectors
 */
export function useConnectRestWithHana(): {
  connectRest: () => Promise<ConnectRestResult>;
  isPending: boolean;
  hanaConnectors: Map<ChainType, XConnector | undefined>;
} {
  const evmConnectors = useXConnectors('EVM');
  const iconConnectors = useXConnectors('ICON');
  const solanaConnectors = useXConnectors('SOLANA');
  const suiConnectors = useXConnectors('SUI');
  const stellarConnectors = useXConnectors('STELLAR');
  const xAccounts = useXAccounts();

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

  const connectedChainTypes = useMemo(() => {
    const connected = new Set<ChainType>();
    for (const [chainType, account] of Object.entries(xAccounts)) {
      if (account?.address) {
        connected.add(chainType as ChainType);
      }
    }
    return connected;
  }, [xAccounts]);

  const mutation = useMutation({
    mutationFn: async (): Promise<ConnectRestResult> => {
      const successful: ChainType[] = [];
      const failed: { chainType: ChainType; error: Error }[] = [];
      const skipped: ChainType[] = [];

      for (const chainType of HANA_SUPPORTED_CHAINS) {
        // Skip already connected chains
        if (connectedChainTypes.has(chainType)) {
          skipped.push(chainType);
          continue;
        }

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

      return { successful, failed, skipped };
    },
  });

  const connectRest = useCallback(async (): Promise<ConnectRestResult> => {
    return mutation.mutateAsync();
  }, [mutation]);

  return {
    connectRest,
    isPending: mutation.isPending,
    hanaConnectors,
  };
}
