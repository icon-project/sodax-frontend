import type { Address } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseReservesListParams = {
  queryOptions?: Omit<UseQueryOptions<readonly Address[], Error>, 'queryKey' | 'queryFn'>;
};

/**
 * React hook for fetching the list of reserve asset addresses currently registered in the
 * Sodax money market.
 */
export function useReservesList(
  params?: UseReservesListParams,
): UseQueryResult<readonly Address[], Error> {
  const { sodax } = useSodaxContext();

  return useQuery<readonly Address[], Error>({
    queryKey: ['mm', 'reservesList'],
    queryFn: async () => sodax.moneyMarket.data.getReservesList(),
    ...params?.queryOptions,
  });
}
