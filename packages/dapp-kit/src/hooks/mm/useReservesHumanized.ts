import type { ReservesDataHumanized } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseReservesHumanizedParams = {
  queryOptions?: Omit<UseQueryOptions<ReservesDataHumanized, Error>, 'queryKey' | 'queryFn'>;
};

/**
 * React hook for fetching the human-readable (decimal-normalized, string-formatted) reserves
 * snapshot from the Sodax money market.
 */
export function useReservesHumanized(
  params?: UseReservesHumanizedParams,
): UseQueryResult<ReservesDataHumanized, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['mm', 'reservesHumanized'],
    queryFn: async () => sodax.moneyMarket.data.getReservesHumanized(),
    refetchInterval: 5000,
    ...params?.queryOptions,
  });
}
