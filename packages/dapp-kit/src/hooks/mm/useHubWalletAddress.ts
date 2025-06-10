import { type EvmHubProvider, EvmWalletAbstraction, type SpokeChainId } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/**
 * Hook for retrieving the hub wallet address for a given spoke chain and address.
 *
 * This hook fetches the hub wallet address associated with a user's address on a specific spoke chain.
 * It uses the EvmWalletAbstraction to query the hub wallet address from the hub provider.
 *
 * @param spokeChainId - The chain ID of the spoke chain
 * @param address - The user's address on the spoke chain
 * @param hubProvider - The hub provider instance
 *
 * @returns {UseQueryResult<string | null>} A query result object containing:
 *   - data: The hub wallet address or null if not found
 *   - isLoading: Boolean indicating if the query is in progress
 *   - error: Error object if the query failed, null otherwise
 *
 * @example
 * ```typescript
 * const { data: hubWalletAddress, isLoading, error } = useHubWalletAddress(spokeChainId, address, hubProvider);
 * ```
 */

export function useHubWalletAddress(
  spokeChainId: SpokeChainId,
  address: string | undefined,
  hubProvider: EvmHubProvider,
): UseQueryResult<string | null> {
  return useQuery({
    queryKey: ['hubWallet', spokeChainId, address],
    queryFn: async () => {
      if (!address) return null;

      try {
        const hubWalletAddress = await EvmWalletAbstraction.getUserHubWalletAddress(
          spokeChainId,
          address as `0x${string}`,
          hubProvider,
        );
        return hubWalletAddress;
      } catch (error) {
        console.log('error', error);
        return null;
      }
    },
    enabled: !!address && !!hubProvider,
  });
}
