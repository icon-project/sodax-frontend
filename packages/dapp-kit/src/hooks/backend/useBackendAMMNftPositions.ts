import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import type { AMMNftPositionsResponse } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseBackendAMMNftPositionsParams = {
  owner: string | undefined;
  pagination?: { offset: number; limit: number };
  queryOptions?: UseQueryOptions<AMMNftPositionsResponse | undefined, Error>;
};

/**
 * Hook for fetching AMM NFT pool positions for a given owner from the backend API.
 *
 * @param {UseBackendAMMNftPositionsParams | undefined} params - Parameters object:
 *   - `owner`: The owner's wallet address. If undefined or empty, the query is disabled.
 *   - `pagination`: Optional pagination configuration with `offset` and `limit`.
 *   - `queryOptions`: Optional React Query options to override default behavior.
 *
 * @returns {UseQueryResult<AMMNftPositionsResponse | undefined, Error>} React Query result object:
 *   - `data`: The AMM NFT positions response, or undefined if unavailable.
 *   - `isLoading`: Loading state.
 *   - `error`: Error instance if the query failed.
 *   - `refetch`: Function to re-trigger the query.
 *
 * @example
 * const { data, isLoading, error } = useBackendAMMNftPositions({
 *   owner: '0xabc...',
 *   pagination: { offset: 0, limit: 50 },
 * });
 */
export const useBackendAMMNftPositions = (
  params: UseBackendAMMNftPositionsParams | undefined,
): UseQueryResult<AMMNftPositionsResponse | undefined, Error> => {
  const { sodax } = useSodaxContext();

  const defaultQueryOptions = {
    queryKey: ['api', 'amm', 'nftPositions', params?.owner, params?.pagination?.offset, params?.pagination?.limit],
    enabled: !!params?.owner,
    staleTime: 30 * 1000, // 30 seconds for near-real-time data
    retry: 3,
  };

  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions, // override default query options if provided
  };

  return useQuery({
    ...queryOptions,
    queryFn: async (): Promise<AMMNftPositionsResponse | undefined> => {
      if (!params?.owner) {
        return undefined;
      }

      return sodax.backendApi.getAMMNftPositions({
        owner: params.owner,
        offset: params.pagination?.offset,
        limit: params.pagination?.limit,
      });
    },
  });
};
