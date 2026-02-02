// packages/dapp-kit/src/hooks/backend/useIntentByTxHash.ts
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import type { IntentResponse } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseBackendIntentByTxHashParams = {
  params: {
    txHash: string | undefined;
  };
  queryOptions?: UseQueryOptions<IntentResponse | undefined, Error>;
};

/**
 * React hook for fetching intent details from the backend API using a transaction hash.
 *
 * @param {UseBackendIntentByTxHashParams | undefined} params - Parameters for the query:
 *   - params: { txHash: string | undefined }
 *       - `txHash`: Transaction hash used to retrieve the associated intent; query is disabled if undefined or empty.
 *   - queryOptions (optional): React Query options to customize request behavior (e.g., caching, retry, refetchInterval, etc.).
 *
 * @returns {UseQueryResult<IntentResponse | undefined, Error>} React Query result object, including:
 *   - `data`: The intent response or undefined if unavailable,
 *   - `isLoading`: Loading state,
 *   - `error`: Error (if request failed),
 *   - `refetch`: Function to refetch the data.
 *
 * @example
 * const { data: intent, isLoading, error } = useBackendIntentByTxHash({
 *   params: { txHash: '0x123...' },
 * });
 *
 * if (isLoading) return <div>Loading intent...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (intent) {
 *   console.log('Intent found:', intent.intentHash);
 * }
 *
 * @remarks
 * - Intents are only created on the hub chain, so `txHash` must originate from there.
 * - Query is disabled if `params` is undefined, or if `params.params.txHash` is undefined or an empty string.
 * - Default refetch interval is 1 second. Uses React Query for state management, caching, and retries.
 */
export const useBackendIntentByTxHash = (
  params: UseBackendIntentByTxHashParams | undefined,
): UseQueryResult<IntentResponse | undefined, Error> => {
  const { sodax } = useSodaxContext();

  const defaultQueryOptions = {
    queryKey: ['api', 'intent', 'txHash', params?.params?.txHash],
    enabled: !!params?.params?.txHash && params?.params?.txHash.length > 0,
    retry: 3,
    refetchInterval: 1000,
  };

  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions,
  };

  return useQuery({
    ...queryOptions,
    queryFn: async (): Promise<IntentResponse | undefined> => {
      if (!params?.params?.txHash) {
        return undefined;
      }
      return sodax.backendApi.getIntentByTxHash(params.params.txHash);
    },
  });
};
