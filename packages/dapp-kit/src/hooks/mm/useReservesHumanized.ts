import type { ReservesDataHumanized } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseReservesHumanizedParams = {
  queryOptions?: UseQueryOptions<ReservesDataHumanized, Error>;
};

/**
 * Hook for fetching humanized reserves data from the Sodax money market.
 *
 * This hook provides access to the current state of all reserves (humanized format) in the money market protocol,
 * including liquidity, interest rates, and other key metrics. The data is automatically
 * fetched and cached using React Query.
 *
 * @example
 * ```typescript
 * const { data: reservesHumanized, isLoading, error } = useReservesHumanized();
 * ```
 *
 * @returns A React Query result object containing:
 *   - data: The reserves humanized data when available
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during data fetching
 */
export function useReservesHumanized(
  params?: UseReservesHumanizedParams,
): UseQueryResult<ReservesDataHumanized, Error> {
  const defaultQueryOptions = { queryKey: ['mm', 'reservesHumanized'], refetchInterval: 5000 };
  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions, // override default query options if provided
  };
  const { sodax } = useSodaxContext();

  return useQuery({
    ...queryOptions,
    queryFn: async () => {
      return await sodax.moneyMarket.data.getReservesHumanized();
    },
  });
}
