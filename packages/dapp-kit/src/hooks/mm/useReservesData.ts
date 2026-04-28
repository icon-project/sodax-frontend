import type { AggregatedReserveData, BaseCurrencyInfo } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseReservesDataParams = {
  queryOptions?: Omit<
    UseQueryOptions<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo], Error>,
    'queryKey' | 'queryFn'
  >;
};

/**
 * React hook for fetching the latest aggregated reserves data and base-currency info from the
 * Sodax money market.
 */
export function useReservesData(
  params?: UseReservesDataParams,
): UseQueryResult<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo], Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['mm', 'reservesData'],
    queryFn: async () => sodax.moneyMarket.data.getReservesData(),
    refetchInterval: 5000,
    ...params?.queryOptions,
  });
}
