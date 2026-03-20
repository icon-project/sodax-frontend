import { useMutation, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';
import type { SubmitSwapTxRequest, SubmitSwapTxResponse } from '@sodax/types';
import type { RequestOverrideConfig } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseBackendSubmitSwapTxParams = {
  apiConfig?: RequestOverrideConfig;
  mutationOptions?: UseMutationOptions<SubmitSwapTxResponse, Error, SubmitSwapTxRequest>;
};

/**
 * React hook for submitting a swap transaction to be processed by the backend
 * (relay, post execution to solver, etc.).
 *
 * @param {UseBackendSubmitSwapTxParams | undefined} params - Optional parameters:
 *   - `mutationOptions`: React Query mutation options to customize behavior (e.g., onSuccess, onError, retry).
 *
 * @returns {UseMutationResult<SubmitSwapTxResponse, Error, SubmitSwapTxRequest>} React Query mutation result:
 *   - `mutate` / `mutateAsync`: Functions to trigger the submission.
 *   - `data`: The submit response on success.
 *   - `isPending`: Loading state.
 *   - `error`: Error instance if the mutation failed.
 *
 * @example
 * const { mutateAsync: submitSwapTx, isPending, error } = useBackendSubmitSwapTx();
 *
 * const result = await submitSwapTx({
 *   txHash: '0x123...',
 *   srcChainId: '1',
 *   walletAddress: '0xabc...',
 *   intent: { ... },
 *   relayData: '0x...',
 * });
 */
export const useBackendSubmitSwapTx = (
  params?: UseBackendSubmitSwapTxParams,
): UseMutationResult<SubmitSwapTxResponse, Error, SubmitSwapTxRequest> => {
  const { sodax } = useSodaxContext();

  const defaultMutationOptions = {
    retry: 3,
  };

  const mutationOptions = {
    ...defaultMutationOptions,
    ...params?.mutationOptions,
  };

  return useMutation({
    ...mutationOptions,
    mutationFn: async (request: SubmitSwapTxRequest): Promise<SubmitSwapTxResponse> => {
      return sodax.backendApi.submitSwapTx(request, params?.apiConfig);
    },
  });
};
