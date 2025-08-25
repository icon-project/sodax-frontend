import { useQuery } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for fetching list of reserves from the Sodax money market.
 *
 * This hook provides access to the list of addresses of all reserves in the money market protocol.
 * The data is automatically fetched and cached using React Query.
 *
 * @example
 * ```typescript
 * const { data: reservesList, isLoading, error } = useReservesList();
 * ```
 *
 * @returns A React Query result object containing:
 *   - data: The reserves list when available
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during data fetching
 */
export function useReservesList() {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['reservesList'],
    queryFn: async () => {
      return await sodax.moneyMarket.data.getReservesList();
    },
  });
}
