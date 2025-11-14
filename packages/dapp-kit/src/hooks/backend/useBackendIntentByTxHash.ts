// packages/dapp-kit/src/hooks/backend/useIntentByTxHash.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { IntentResponse } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for fetching intent details by intent created transaction hash from the backend API.
 *
 * This hook provides access to intent data associated with the transaction hash from when
 * the intent was created on the hub chain, including intent details, events, and transaction
 * information. The data is automatically fetched and cached using React Query.
 *
 * @param {string | undefined} txHash - The intent created transaction hash from the hub chain to fetch intent for. If undefined, the query will be disabled.
 *
 * @returns {UseQueryResult<IntentResponse | undefined>} A query result object containing:
 *   - data: The intent response data when available
 *   - isLoading: Boolean indicating if the request is in progress
 *   - error: Error object if the request failed
 *   - refetch: Function to manually trigger a data refresh
 *
 * @example
 * ```typescript
 * const { data: intent, isLoading, error } = useIntentByTxHash('0x123...');
 *
 * if (isLoading) return <div>Loading intent...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (intent) {
 *   console.log('Intent found:', intent.intentHash);
 * }
 * ```
 *
 * @remarks
 * - Intents are only created on the hub chain, so the transaction hash must be from the hub chain
 * - The query is disabled when txHash is undefined or empty
 * - Uses React Query for efficient caching and state management
 * - Automatically handles error states and loading indicators
 */
export const useBackendIntentByTxHash = (txHash: string | undefined): UseQueryResult<IntentResponse | undefined> => {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['backend', 'intent', 'txHash', txHash],
    queryFn: async (): Promise<IntentResponse | undefined> => {
      if (!txHash) {
        return undefined;
      }

      return sodax.backendApi.getIntentByTxHash(txHash);
    },
    refetchInterval: 1000,
    enabled: !!txHash && txHash.length > 0,
    retry: 3,
  });
};
