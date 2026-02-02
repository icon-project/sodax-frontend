import type { SpokeProvider, UserReserveData } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseUserReservesDataParams = {
  spokeProvider: SpokeProvider | undefined;
  address: string | undefined;
  queryOptions?: UseQueryOptions<readonly [readonly UserReserveData[], number], Error>;
};

/**
 * Hook for fetching user reserves data from the Sodax money market.
 *
 * @param params (optional) - Object including:
 *   - spokeProvider: The SpokeProvider instance required for data fetching. If not provided, data fetching is disabled.
 *   - address: The user's address (string) whose reserves data will be fetched. If not provided, data fetching is disabled.
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
 *   spokeProvider,
 *   address,
 * });
 */
export function useUserReservesData(
  params?: UseUserReservesDataParams,
): UseQueryResult<readonly [readonly UserReserveData[], number], Error> {
  const { sodax } = useSodaxContext();
  const defaultQueryOptions =  {
    queryKey: ['mm', 'userReservesData', params?.spokeProvider?.chainConfig.chain.id, params?.address],
    enabled: !!params?.spokeProvider && !!params?.address,
    refetchInterval: 5000,
  };
  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions,  // override default query options if provided
  };

  return useQuery({
    ...queryOptions,
    queryFn: async () => {
      if (!params?.spokeProvider || !params?.address) {
        throw new Error('Spoke provider or address is not defined');
      }

      return await sodax.moneyMarket.data.getUserReservesData(params.spokeProvider);
    },
  });
}
