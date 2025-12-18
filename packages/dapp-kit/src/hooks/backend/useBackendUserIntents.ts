// packages/dapp-kit/src/hooks/backend/useBackendUserIntents.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Address, UserIntentsResponse } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for fetching all intents created by a specific user from the backend API.
 *
 * This hook provides access to user intent data with optional filtering by date range
 * and pagination support. The data is automatically fetched and cached using React Query.
 *
 * @param {Object} params - Parameters for fetching user intents
 * @param {Address} params.userAddress - The user's wallet address on the hub chain (required)
 * @param {number} [params.startDate] - Optional. Start timestamp in milliseconds for filtering by date
 * @param {number} [params.endDate] - Optional. End timestamp in milliseconds for filtering by date
 * @param {string} [params.limit] - Optional. Max number of results for pagination
 * @param {string} [params.offset] - Optional. Pagination offset
 *
 * @returns {UseQueryResult<UserIntentsResponse | undefined>} A query result object containing:
 *   - data: The user intents response data when available
 *   - isLoading: Boolean indicating if the request is in progress
 *   - error: Error object if the request failed
 *   - refetch: Function to manually trigger a data refresh
 *
 * @example
 * ```typescript
 * const { data: userIntents, isLoading, error } = useBackendUserIntents({
 *   userAddress: '0x123...',
 *   limit: '10',
 *   offset: '0'
 * });
 *
 * if (isLoading) return <div>Loading user intents...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (userIntents) {
 *   console.log('Total intents:', userIntents.total);
 *   console.log('Intents:', userIntents.items);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With date filtering
 * const { data: userIntents } = useBackendUserIntents({
 *   userAddress: '0x123...',
 *   startDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
 *   endDate: Date.now(),
 *   limit: '20'
 * });
 * ```
 *
 * @remarks
 * - The query is disabled when userAddress is undefined or empty
 * - Uses React Query for efficient caching and state management
 * - Automatically handles error states and loading indicators
 * - Supports optional date range filtering and pagination
 * - Retries failed requests up to 3 times
 */
export const useBackendUserIntents = (
  params:
    | {
        userAddress: Address;
        startDate?: number;
        endDate?: number;
        limit?: string;
        offset?: string;
      }
    | undefined,
): UseQueryResult<UserIntentsResponse | undefined> => {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['backend', 'intent', 'user', params],
    queryFn: async (): Promise<UserIntentsResponse | undefined> => {
      if (!params || !params.userAddress) {
        return undefined;
      }

      return sodax.backendApi.getUserIntents(params);
    },
    enabled: !!params && !!params.userAddress && params.userAddress.length > 0,
    retry: 3,
  });
};

