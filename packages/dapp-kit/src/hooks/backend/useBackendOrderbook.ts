import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import type { OrderbookResponse } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { BackendPaginationParams } from './types';

export type UseBackendOrderbookParams = {
  queryOptions?: UseQueryOptions<OrderbookResponse | undefined, Error>;
  pagination?: BackendPaginationParams;
};

/**
 * Hook for fetching the solver orderbook from the backend API.
 *
 * @param {UseBackendOrderbookParams | undefined} params - Optional parameters:
 *   - `pagination`: Pagination configuration (see `BackendPaginationParams`), including
 *      `offset` and `limit` (both required for fetch to be enabled).
 *   - `queryOptions`: Optional React Query options to override default behavior.
 *
 * @returns {UseQueryResult<OrderbookResponse | undefined, Error>} React Query result object:
 *   - `data`: The orderbook response, or undefined if unavailable.
 *   - `isLoading`: Loading state.
 *   - `error`: Error instance if the query failed.
 *   - `refetch`: Function to re-trigger the query.
 *
 * @example
 * const { data, isLoading, error } = useBackendOrderbook({
 *   pagination: { offset: '0', limit: '10' },
 *   queryOptions: { staleTime: 60000 },
 * });
 *
 * @remarks
 * - Query is disabled if `params?.pagination`, `offset`, or `limit` are missing/empty.
 * - Caches and manages server state using React Query.
 * - Default `staleTime` is 30 seconds to support near-real-time updates.
 */
export const useBackendOrderbook = (
  params: UseBackendOrderbookParams | undefined,
): UseQueryResult<OrderbookResponse | undefined> => {
  const { sodax } = useSodaxContext();

  const defaultQueryOptions = {
    queryKey: ['api', 'solver', 'orderbook', params?.pagination?.offset, params?.pagination?.limit],
    enabled: !!params?.pagination && !!params?.pagination.offset && !!params?.pagination.limit,
    staleTime: 30 * 1000, // 30 seconds for real-time data
    retry: 3,
  };

  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions, // override default query options if provided
  };

  return useQuery({
    ...queryOptions,
    queryFn: async (): Promise<OrderbookResponse | undefined> => {
      if (!params?.pagination || !params?.pagination.offset || !params?.pagination.limit) {
        return undefined;
      }

      return sodax.backendApi.getOrderbook(params.pagination);
    },
  });
};
