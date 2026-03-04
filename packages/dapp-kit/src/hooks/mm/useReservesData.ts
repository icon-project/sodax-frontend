import { useQuery, type UseQueryResult, type UseQueryOptions } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { AggregatedReserveData, BaseCurrencyInfo } from '@sodax/sdk';

export type UseReservesDataParams = {
  queryOptions?: UseQueryOptions<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo], Error>;
};

/**
 * React hook for fetching the latest reserves data from the Sodax money market.
 *
 * Provides the full set of aggregated reserves and base currency information.
 * Optionally accepts React Query options for customizing the query key, cache time, and related behaviors.
 *
 * @param params (optional) - Object including:
 *   - queryOptions: Custom React Query options
 *
 * @returns {UseQueryResult<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo], Error>}
 *   React Query result object containing:
 *     - data: [aggregated reserves[], base currency info], or undefined if not loaded
 *     - isLoading: True if the request is loading
 *     - isError: True if the request failed
 *     - error: Error object, if present
 *
 * @example
 * const { data, isLoading, error } = useReservesData();
 * const { data } = useReservesData({ queryOptions: { queryKey: ['custom', 'reservesData'] } });
 */
export function useReservesData(
  params?: UseReservesDataParams,
): UseQueryResult<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo], Error> {
  const defaultQueryOptions = {
    queryKey: ['mm', 'reservesData'],
    refetchInterval: 5000,
  };

  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions, // override default query options if provided
  }
  const { sodax } = useSodaxContext();

  return useQuery({
    ...queryOptions,
    queryFn: async (): Promise<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo]> => {
      return await sodax.moneyMarket.data.getReservesData();
    },
  });
}
