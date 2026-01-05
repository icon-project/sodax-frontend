// packages/dapp-kit/src/hooks/backend/useBackendUserIntents.ts
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import type { Address, UserIntentsResponse } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { QueryHookParams } from '../shared';

export type GetUserIntentsParams = {
  userAddress: Address;
  startDate?: number;
  endDate?: number;
  limit?: string;
  offset?: string;
};

export type UseBackendUserIntentsParams = QueryHookParams<GetUserIntentsParams, UseQueryOptions<UserIntentsResponse | undefined>>;

/**
 * React hook for querying user-created intents from the backend API, filtered by user and optional time range and pagination.
 *
 * @function
 * @param {UseBackendUserIntentsParams} args - Parameters for the query.
 * @param {GetUserIntentsParams | undefined} args.params - Object containing user intent filter fields.
 *   @param {Address} args.params.userAddress - The wallet address of the user (required).
 *   @param {number} [args.params.startDate] - Filter results to only include intents created after this timestamp (inclusive, ms).
 *   @param {number} [args.params.endDate] - Filter results to only include intents created before this timestamp (inclusive, ms).
 *   @param {string} [args.params.limit] - Pagination: maximum number of items to return.
 *   @param {string} [args.params.offset] - Pagination: offset to start result list.
 * @param {UseQueryOptions<UserIntentsResponse | undefined>} [args.queryOptions] - Optional react-query options to control caching, refetching, etc.
 *
 * @returns {UseQueryResult<UserIntentsResponse | undefined>} React Query object:
 *   - `data`: User intents response, or undefined if not loaded or query is disabled.
 *   - `isLoading`: Whether the query is fetching.
 *   - `error`: Error object returned on failure.
 *   - `refetch`: Function to manually trigger data refresh.
 *
 * @example
 * // Basic usage, fetch with pagination:
 * const { data: userIntents, isLoading, error } = useBackendUserIntents({
 *   params: {
 *     userAddress: '0x123...',
 *     limit: '10',
 *     offset: '0'
 *   }
 * });
 *
 * @example
 * // With date range:
 * const { data } = useBackendUserIntents({
 *   params: {
 *     userAddress: '0xabc...',
 *     startDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
 *     endDate: Date.now()
 *   }
 * });
 *
 * @remarks
 * - Query is automatically disabled when `params` or `params.userAddress` is falsy or empty.
 * - Uses React Query for caching and state management.
 * - Automatically handles loading and error states.
 * - Retries failed requests up to three times by default.
 * - Response shape: `{ total: number, items: IntentItem[] }`
 */
export const useBackendUserIntents = ({
  params,
  queryOptions = {
    queryKey: ['backend', 'intent', 'user', params],
    enabled: !!params && !!params.userAddress && params.userAddress.length > 0,
    retry: 3,
  },
}: UseBackendUserIntentsParams): UseQueryResult<UserIntentsResponse | undefined> => {
  const { sodax } = useSodaxContext();

  return useQuery({
    ...queryOptions,
    queryFn: async (): Promise<UserIntentsResponse | undefined> => {
      if (!params?.userAddress) {
        return undefined;
      }

      return sodax.backendApi.getUserIntents(params);
    },
  });
};
