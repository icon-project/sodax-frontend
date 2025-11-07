// packages/dapp-kit/src/hooks/backend/useOrderbook.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { OrderbookResponse } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for fetching the solver orderbook from the backend API.
 *
 * This hook provides access to the solver orderbook data, including intent states
 * and intent data for all available intents. The data is automatically fetched
 * and cached using React Query with pagination support.
 *
 * @param {Object} params - Pagination parameters for the orderbook
 * @param {string} params.offset - The offset for pagination (number as string)
 * @param {string} params.limit - The limit for pagination (number as string)
 *
 * @returns {UseQueryResult<OrderbookResponse | undefined>} A query result object containing:
 *   - data: The orderbook response data when available
 *   - isLoading: Boolean indicating if the request is in progress
 *   - error: Error object if the request failed
 *   - refetch: Function to manually trigger a data refresh
 *
 * @example
 * ```typescript
 * const { data: orderbook, isLoading, error } = useOrderbook({
 *   offset: '0',
 *   limit: '10'
 * });
 *
 * if (isLoading) return <div>Loading orderbook...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (orderbook) {
 *   console.log('Total intents:', orderbook.total);
 *   console.log('Intents:', orderbook.data);
 * }
 * ```
 *
 * @remarks
 * - The query is disabled when params are undefined or invalid
 * - Uses React Query for efficient caching and state management
 * - Automatically handles error states and loading indicators
 * - Stale time of 30 seconds for real-time orderbook data
 * - Supports pagination through offset and limit parameters
 */
export const useBackendOrderbook = (
  params: { offset: string; limit: string } | undefined,
): UseQueryResult<OrderbookResponse | undefined> => {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['backend', 'solver', 'orderbook', params],
    queryFn: async (): Promise<OrderbookResponse | undefined> => {
      if (!params || !params.offset || !params.limit) {
        return undefined;
      }

      return sodax.backendApi.getOrderbook(params);
    },
    enabled: !!params && !!params.offset && !!params.limit,
    staleTime: 30 * 1000, // 30 seconds for real-time data
    retry: 3,
  });
};
