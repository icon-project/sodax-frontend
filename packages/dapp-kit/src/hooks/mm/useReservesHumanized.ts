import { type ReservesDataHumanized } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
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
export function useReservesHumanized(): UseQueryResult<ReservesDataHumanized, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['reservesHumanized'],
    queryFn: async () => {
      return await sodax.moneyMarket.data.getReservesHumanized();
    },
  });
}
