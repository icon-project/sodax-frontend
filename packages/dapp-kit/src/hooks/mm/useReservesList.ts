import { useQuery, type UseQueryResult, type UseQueryOptions } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { Address } from '@sodax/sdk';

export type UseReservesListParams = {
  queryOptions?: UseQueryOptions<readonly Address[], Error>;
};

/**
 * React hook for fetching the list of reserve addresses from the Sodax money market.
 *
 * This hook returns a React Query result object containing the array of all reserve `Address`
 * values currently available in the protocol. Optionally, custom React Query options can be provided.
 *
 * @param params (optional) - Object including:
 *   - queryOptions: Custom React Query options such as `queryKey`, cache behavior, or refetching policy
 *
 * @returns {UseQueryResult<readonly Address[], Error>} React Query result object containing:
 *   - data: Array of reserve addresses, or undefined if loading
 *   - isLoading: Boolean loading state
 *   - isError: Boolean error state
 *   - error: Error object, if present
 *
 * @example
 * const { data: reservesList, isLoading, error } = useReservesList();
 * const { data } = useReservesList({ queryOptions: { queryKey: ['custom', 'reservesList'] } });
 */
export function useReservesList(params?: UseReservesListParams): UseQueryResult<readonly Address[], Error> {
  const defaultQueryOptions = { queryKey: ['mm', 'reservesList'] };
  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions, // override default query options if provided
  };
  const { sodax } = useSodaxContext();

  return useQuery<readonly Address[], Error>({
    ...queryOptions,
    queryFn: async (): Promise<readonly Address[]> => {
      return await sodax.moneyMarket.data.getReservesList();
    },
  });
}
