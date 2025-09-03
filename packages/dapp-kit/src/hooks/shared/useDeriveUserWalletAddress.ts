// packages/dapp-kit/src/hooks/shared/useDeriveUserWalletAddress.ts
import { deriveUserWalletAddress, type SpokeProvider, type EvmHubProvider } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from './useSodaxContext';
import type { Address } from 'viem';

/**
 * Hook for deriving user wallet address for hub abstraction.
 *
 * This hook derives the user's abstracted wallet address for the hub chain.
 * If the spoke chain is the same as the hub chain, it returns the original wallet address.
 * Otherwise, it returns the abstracted wallet address for cross-chain operations.
 *
 * @param spokeProvider - The spoke provider instance for the origin chain
 * @param walletAddress - Optional user wallet address on spoke chain. If not provided, will fetch from spokeProvider
 * @returns A React Query result object containing:
 *   - data: The derived user wallet address when available
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during derivation
 *
 * @example
 * ```typescript
 * const { data: derivedAddress, isLoading, error } = useDeriveUserWalletAddress(spokeProvider, userAddress);
 * ```
 */
export function useDeriveUserWalletAddress(
  spokeProvider: SpokeProvider | undefined,
  walletAddress?: string | undefined,
): UseQueryResult<Address, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['deriveUserWalletAddress', spokeProvider?.chainConfig.chain.id, walletAddress],
    queryFn: async (): Promise<Address> => {
      if (!spokeProvider) {
        throw new Error('Spoke provider is required');
      }

      return await deriveUserWalletAddress(spokeProvider, sodax.hubProvider, walletAddress);
    },
    enabled: !!spokeProvider,
    refetchInterval: false, // This is a deterministic operation, no need to refetch
  });
}
