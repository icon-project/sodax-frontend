import type { SpokeChainId } from '@sodax/types';
import type { UserReserveData } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseUserReservesDataParams = {
  /** Spoke chain id (e.g. '0xa86a.avax') */
  spokeChainId: SpokeChainId | undefined;
  /** User wallet address on the spoke chain */
  userAddress: string | undefined;
  queryOptions?: UseQueryOptions<readonly [readonly UserReserveData[], number], Error>;
};

/**
 * Hook for fetching user reserves data from the Sodax money market.
 *
 * @param params (optional) - Object including:
 *   - spokeChainId: The spoke chain id whose reserves data will be fetched. If not provided, data fetching is disabled.
 *   - userAddress: The user's address (string) whose reserves data will be fetched. If not provided, data fetching is disabled.
 *   - queryOptions: (optional) Custom React Query options such as `queryKey`, `enabled`, or cache policy.
 *
 * @returns {UseQueryResult<readonly [readonly UserReserveData[], number], Error>} React Query result object containing:
 *   - data: A tuple with array of UserReserveData and associated number, or undefined if loading
 *   - isLoading: Boolean loading state
 *   - isError: Boolean error state
 *   - error: Error object, if present
 *
 * @example
 * const { data: userReservesData, isLoading, error } = useUserReservesData({
 *   spokeChainId,
 *   userAddress,
 * });
 */
export function useUserReservesData(
  params?: UseUserReservesDataParams,
): UseQueryResult<readonly [readonly UserReserveData[], number], Error> {
  const { sodax } = useSodaxContext();
  const defaultQueryOptions = {
    queryKey: ['mm', 'userReservesData', params?.spokeChainId, params?.userAddress],
    enabled: !!params?.spokeChainId && !!params?.userAddress,
    refetchInterval: 5000,
  };
  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions, // override default query options if provided
  };

  return useQuery({
    ...queryOptions,
    queryFn: async () => {
      if (!params?.spokeChainId || !params?.userAddress) {
        throw new Error('spokeChainId or userAddress is not defined');
      }

      return await sodax.moneyMarket.data.getUserReservesData(
        params.spokeChainId as never,
        params.userAddress as never,
      );
    },
  });
}
