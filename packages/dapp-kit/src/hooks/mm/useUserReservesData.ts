import { type UserReserveData, WalletAbstractionService } from '@sodax/sdk';
import type { ChainId } from '@sodax/types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import { useSpokeProvider } from '../provider/useSpokeProvider';

/**
 * Hook for fetching user reserves data from the Sodax money market.
 *
 * This hook provides access to the current state of user reserves in the money market protocol.
 * The data is automatically fetched and cached using React Query.
 *
 * @example
 * ```typescript
 * const { data: userReservesData, isLoading, error } = useUserReservesData();
 * ```
 *
 * @returns A React Query result object containing:
 *   - data: The user reserves data when available
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during data fetching
 */
export function useUserReservesData(
  spokeChainId: ChainId | undefined,
  address: string | undefined,
  refetchInterval = 5000,
): UseQueryResult<readonly [readonly UserReserveData[], number] | undefined, Error> {
  const { sodax } = useSodaxContext();
  const spokeProvider = useSpokeProvider(spokeChainId);

  return useQuery({
    queryKey: ['userReserves', spokeChainId, address],
    queryFn: async () => {
      if (!spokeProvider || !address) {
        return undefined;
      }

      const hubWalletAddress = await WalletAbstractionService.getUserHubWalletAddress(
        address,
        spokeProvider,
        sodax.hubProvider,
      );

      return await sodax.moneyMarket.data.getUserReservesData(hubWalletAddress);
    },
    enabled: !!spokeChainId && !!address,
    refetchInterval,
  });
}
