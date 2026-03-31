import type { ChainType } from '@sodax/types';
import { useMemo } from 'react';
import type { XConnector } from '../core';
import { useXWagmiStore } from '../useXWagmiStore';
import { useStellarXConnectors } from '../xchains/stellar/useStellarXConnectors';
import { useNearXConnectors } from '../xchains/near/useNearXConnectors';

/**
 * Hook to retrieve available wallet connectors for a specific blockchain type.
 *
 * Reads connectors from the centralized store (hydrated by chain providers).
 * Stellar and Near use async discovery hooks as their connectors are detected at runtime.
 *
 * @param xChainType - The blockchain type to get connectors for
 * @returns An array of XConnector instances compatible with the specified chain type
 */
export function useXConnectors(xChainType: ChainType | undefined): XConnector[] {
  const xConnectorsByChain = useXWagmiStore(state => state.xConnectorsByChain);

  // Stellar and Near discover connectors asynchronously
  const { data: stellarXConnectors } = useStellarXConnectors();
  const { data: nearXConnectors } = useNearXConnectors();

  return useMemo((): XConnector[] => {
    if (!xChainType) return [];

    // Stellar and Near have async connector discovery — use their hooks
    if (xChainType === 'STELLAR') return stellarXConnectors ?? [];
    if (xChainType === 'NEAR') return nearXConnectors ?? [];

    // All other chains read from store
    return xConnectorsByChain[xChainType] ?? [];
  }, [xChainType, xConnectorsByChain, stellarXConnectors, nearXConnectors]);
}
