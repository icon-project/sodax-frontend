import type { UserIntentsResponse, Address } from '@sodax/sdk';
// packages/dapp-kit/src/hooks/backend/useBackendUserIntents.ts
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { BackendPaginationParams } from './types';

export type GetUserIntentsParams = {
  userAddress: Address;
  startDate?: number;
  endDate?: number;
};

export type UseBackendUserIntentsParams = {
  params?: GetUserIntentsParams;
  queryOptions?: UseQueryOptions<UserIntentsResponse | undefined, Error>;
  pagination?: BackendPaginationParams;
};

/**
 * React hook for fetching user-created intents from the backend API for a given user address,
 * with optional support for a date filtering range.
 *
 * @param {UseBackendUserIntentsParams} args - Query configuration.
 *   @param {GetUserIntentsParams | undefined} args.params - User intent filter parameters.
 *     @param {Address} args.params.userAddress - The wallet address of the user (required).
 *     @param {number} [args.params.startDate] - Include intents created after this timestamp (ms).
 *     @param {number} [args.params.endDate] - Include intents created before this timestamp (ms).
 *   @param {UseQueryOptions<UserIntentsResponse | undefined, Error>} [args.queryOptions] - Optional React Query options.
 *   @param {BackendPaginationParams} [args.pagination] - (currently ignored) Pagination options.
 *
 * @returns {UseQueryResult<UserIntentsResponse | undefined, Error>} React Query result:
 *   - `data`: The user intent response, or undefined if unavailable.
 *   - `isLoading`: `true` if loading.
 *   - `error`: An Error instance if any occurred.
 *   - `refetch`: Function to refetch data.
 *
 * @example
 * const { data: userIntents, isLoading, error } = useBackendUserIntents({
 *   params: { userAddress: "0x123..." }
 * });
 *
 * @example
 * const { data } = useBackendUserIntents({
 *   params: {
 *     userAddress: "0xabc...",
 *     startDate: Date.now() - 1_000_000,
 *     endDate: Date.now(),
 *   },
 * });
 *
 * @remarks
 * The query is disabled if `params` or `params.userAddress` is missing or empty. Uses React Query for
 * cache/state management and auto-retries failed requests three times by default.
 */
export const useBackendUserIntents = ({
  params,
  queryOptions,
}: UseBackendUserIntentsParams): UseQueryResult<UserIntentsResponse | undefined, Error> => {
  const { sodax } = useSodaxContext();
  const defaultQueryOptions = {
    queryKey: ['api', 'intent', 'user', params],
    enabled: !!params && !!params.userAddress && params.userAddress.length > 0,
    retry: 3,
  };

  queryOptions = {
    ...defaultQueryOptions,
    ...queryOptions, // override default query options if provided
  };

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
