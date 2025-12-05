import { deriveUserWalletAddress, type SpokeProvider, type SpokeChainId } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from './useSodaxContext';
import type { Address } from 'viem';

/**
 * Hook for deriving user wallet address for hub abstraction.
 *
 * This hook derives the user's abstracted wallet address for the hub chain based on the spoke chain ID and address.
 * If the spoke chain is the same as the hub chain, it returns the encoded spoke address.
 * Otherwise, it derives and returns the abstracted wallet address for cross-chain operations.
 *
 * The query is automatically enabled when both `spokeChainId` and `spokeAddress` are provided.
 * This is a deterministic operation, so the result is cached and not refetched automatically.
 *
 * @param spokeChainId - Optional spoke chain ID. If not provided, the query will be disabled.
 * @param spokeAddress - Optional user wallet address on the spoke chain. If not provided, the query will be disabled.
 * @returns A React Query result object containing:
 *   - data: The derived user wallet address (Address) when available
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during derivation (Error)
 *
 * @example
 * ```typescript
 * const { data: derivedAddress, isLoading, error } = useDeriveUserWalletAddress(spokeChainId, userAddress);
 *
 * if (isLoading) return <div>Deriving address...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (derivedAddress) return <div>Derived Address: {derivedAddress}</div>;
 * ```
 */
export function useDeriveUserWalletAddress(
  spokeChainId?: SpokeChainId | SpokeProvider | undefined,
  spokeAddress?: string | undefined,
): UseQueryResult<Address, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['deriveUserWalletAddress', spokeChainId, spokeAddress],
    queryFn: async (): Promise<Address> => {
      if (!spokeChainId || !spokeAddress) {
        throw new Error('Spoke chain id and address are required');
      }

      // Determine if spokeChainId is a SpokeProvider object or SpokeChainId value
      spokeChainId = typeof spokeChainId === 'object' ? spokeChainId.chainConfig.chain.id : spokeChainId;

      return await deriveUserWalletAddress(sodax.hubProvider, spokeChainId, spokeAddress);
    },
    enabled: !!spokeChainId && !!spokeAddress,
    refetchInterval: false, // This is a deterministic operation, no need to refetch
  });
}
