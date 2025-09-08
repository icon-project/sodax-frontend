// packages/dapp-kit/src/hooks/backend/useIntentByHash.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { IntentResponse } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for fetching intent details by intent hash from the backend API.
 *
 * This hook provides access to intent data using the intent hash directly,
 * including intent details, events, and transaction information. The data is automatically
 * fetched and cached using React Query.
 *
 * @param {string | undefined} intentHash - The intent hash to fetch intent for. If undefined, the query will be disabled.
 *
 * @returns {UseQueryResult<IntentResponse | undefined>} A query result object containing:
 *   - data: The intent response data when available
 *   - isLoading: Boolean indicating if the request is in progress
 *   - error: Error object if the request failed
 *   - refetch: Function to manually trigger a data refresh
 *
 * @example
 * ```typescript
 * const { data: intent, isLoading, error } = useIntentByHash('0xabc...');
 *
 * if (isLoading) return <div>Loading intent...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (intent) {
 *   console.log('Intent found:', intent.intentHash);
 *   console.log('Open status:', intent.open);
 * }
 * ```
 *
 * @remarks
 * - The query is disabled when intentHash is undefined or empty
 * - Uses React Query for efficient caching and state management
 * - Automatically handles error states and loading indicators
 */
export const useBackendIntentByHash = (intentHash: string | undefined): UseQueryResult<IntentResponse | undefined> => {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['backend', 'intent', 'hash', intentHash],
    queryFn: async (): Promise<IntentResponse | undefined> => {
      if (!intentHash) {
        return undefined;
      }

      return sodax.backendApiService.getIntentByHash(intentHash);
    },
    enabled: !!intentHash && intentHash.length > 0,
    retry: 3,
  });
};
