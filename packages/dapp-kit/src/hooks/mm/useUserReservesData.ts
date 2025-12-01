import type { SpokeProvider, UserReserveData } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for fetching user reserves data from the Sodax money market.
 *
 * This hook provides access to the current state of user reserves in the money market protocol,
 * including user's supply positions, borrow positions, and collateral information.
 * The data is automatically fetched and cached using React Query.
 *
 * @param spokeProvider - The spoke provider instance for the target chain
 * @param address - The user's wallet address
 * @param refetchInterval - Interval in milliseconds for automatic refetching (default: 5000)
 *
 * @example
 * ```typescript
 * const { data: userReservesData, isLoading, error } = useUserReservesData(spokeProvider, address);
 * ```
 *
 * @returns A React Query result object containing:
 *   - data: A tuple containing user reserves data array and eMode category ID when available
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during data fetching
 */
export function useUserReservesData(
  spokeProvider: SpokeProvider | undefined,
  address: string | undefined,
  refetchInterval = 5000,
): UseQueryResult<readonly [readonly UserReserveData[], number], Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['userReserves', spokeProvider?.chainConfig.chain.id, address],
    queryFn: async () => {
      if (!spokeProvider) {
        throw new Error('Spoke provider or address is not defined');
      }

      return await sodax.moneyMarket.data.getUserReservesData(spokeProvider);
    },
    enabled: !!spokeProvider && !!address,
    refetchInterval,
  });
}
