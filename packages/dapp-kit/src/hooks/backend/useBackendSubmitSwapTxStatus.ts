import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import type { SubmitSwapTxStatusResponse } from '@sodax/types';
import type { RequestOverrideConfig } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseBackendSubmitSwapTxStatusParams = {
  params: {
    txHash: string | undefined;
    srcChainId?: string;
  };
  apiConfig?: RequestOverrideConfig;
  queryOptions?: UseQueryOptions<SubmitSwapTxStatusResponse | undefined, Error>;
};

/**
 * React hook for polling the processing status of a submitted swap transaction.
 *
 * @param {UseBackendSubmitSwapTxStatusParams | undefined} params - Parameters for the query:
 *   - `params.txHash`: The transaction hash of the submitted swap; query is disabled if undefined or empty.
 *   - `params.srcChainId`: Optional source chain ID to narrow the status lookup.
 *   - `queryOptions`: Optional React Query options to override default behavior (e.g., refetchInterval, retry).
 *
 * @returns {UseQueryResult<SubmitSwapTxStatusResponse | undefined, Error>} React Query result object:
 *   - `data`: The status response or undefined if unavailable.
 *   - `isLoading`: Loading state.
 *   - `error`: Error instance if the query failed.
 *   - `refetch`: Function to re-trigger the query.
 *
 * @example
 * const { data: status, isLoading, error } = useBackendSubmitSwapTxStatus({
 *   params: { txHash: '0x123...', srcChainId: '1' },
 * });
 *
 * if (status?.data.status === 'executed') {
 *   console.log('Swap completed!', status.data.result);
 * }
 *
 * @remarks
 * - Query is disabled if `params` is undefined or `txHash` is undefined/empty.
 * - Default refetch interval is 1 second for real-time status polling.
 * - Uses React Query for state management, caching, and retries.
 */
export const useBackendSubmitSwapTxStatus = (
  params: UseBackendSubmitSwapTxStatusParams | undefined,
): UseQueryResult<SubmitSwapTxStatusResponse | undefined, Error> => {
  const { sodax } = useSodaxContext();

  const defaultQueryOptions = {
    queryKey: ['api', 'swaps', 'submit-tx', 'status', params?.params?.txHash, params?.params?.srcChainId],
    enabled: !!params?.params?.txHash && params.params.txHash.length > 0,
    retry: 3,
    refetchInterval: (query: { state: { data: SubmitSwapTxStatusResponse | undefined } }) => {
      const status = query.state.data?.data?.status;
      if (status === 'executed' || status === 'failed') return false;
      return 1000;
    },
  };

  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions,
  };

  return useQuery({
    ...queryOptions,
    queryFn: async (): Promise<SubmitSwapTxStatusResponse | undefined> => {
      if (!params?.params?.txHash) {
        return undefined;
      }
      return sodax.backendApi.getSubmitSwapTxStatus(
        {
          txHash: params.params.txHash,
          srcChainId: params.params.srcChainId,
        },
        params.apiConfig,
      );
    },
  });
};
