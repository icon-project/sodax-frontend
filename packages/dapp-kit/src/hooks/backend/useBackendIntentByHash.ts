import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import type { IntentResponse } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseBackendIntentByHashParams = {
  params: {
    intentHash: string | undefined;
  };
  queryOptions?: UseQueryOptions<IntentResponse | undefined, Error>;
};

/**
 * React hook to fetch intent details from the backend API using an intent hash.
 *
 * @param {UseBackendIntentByHashParams | undefined} params - Parameters for the query:
 *   - params: { intentHash: string | undefined }
 *     - `intentHash`: The hash identifying the intent to fetch (disables query if undefined or empty).
 *   - queryOptions (optional): Options to customize React Query (e.g., staleTime, enabled).
 *
 * @returns {UseQueryResult<IntentResponse | undefined, Error>} React Query result containing intent response data, loading, error, and refetch states.
 *
 * @example
 * const { data: intent, isLoading, error } = useBackendIntentByHash({
 *   params: { intentHash: '0xabc...' },
 * });
 *
 * if (isLoading) return <div>Loading intent...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (intent) {
 *   console.log('Intent found:', intent.intentHash);
 * }
 *
 * @remarks
 * - Returns `undefined` data if no intentHash is provided or query is disabled.
 * - Query is cached and managed using React Query.
 * - Use `queryOptions` to customize caching, retry and fetch behavior.
 */
export const useBackendIntentByHash = (
  params: UseBackendIntentByHashParams | undefined,
): UseQueryResult<IntentResponse | undefined, Error> => {
  const { sodax } = useSodaxContext();

  const defaultQueryOptions = {
    queryKey: ['api', 'intent', 'hash', params?.params?.intentHash],
    enabled: !!params?.params?.intentHash && params?.params?.intentHash.length > 0,
    retry: 3,
  };
  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions,
  };

  return useQuery({
    ...queryOptions,
    queryFn: async (): Promise<IntentResponse | undefined> => {
      if (!params?.params?.intentHash) {
        return undefined;
      }

      return sodax.backendApi.getIntentByHash(params.params.intentHash);
    },
  });
};
