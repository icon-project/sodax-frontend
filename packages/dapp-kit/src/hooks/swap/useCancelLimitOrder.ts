import { useSodaxContext } from '../shared/useSodaxContext';
import type { Intent, IntentError, IntentErrorCode, Result, SpokeProvider } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

type CancelLimitOrderParams = {
  intent: Intent;
  spokeProvider: SpokeProvider;
  timeout?: number;
};

type CancelLimitOrderResult = Result<[string, string], IntentError<IntentErrorCode>>;

/**
 * Hook for canceling a limit order intent and submitting it to the Relayer API.
 * Uses React Query's useMutation for better state management and caching.
 *
 * This hook wraps cancelLimitOrder which cancels the intent on the spoke chain,
 * submits it to the relayer API, and waits for execution on the destination/hub chain.
 *
 * @returns {UseMutationResult} Mutation result object containing mutation function and state
 *
 * @example
 * ```typescript
 * const { mutateAsync: cancelLimitOrder, isPending } = useCancelLimitOrder();
 *
 * const handleCancelLimitOrder = async () => {
 *   const result = await cancelLimitOrder({
 *     intent: intentObject,
 *     spokeProvider,
 *     timeout: 60000 // optional, defaults to 60 seconds
 *   });
 *
 *   if (result.ok) {
 *     const [cancelTxHash, dstTxHash] = result.value;
 *     console.log('Cancel transaction hash:', cancelTxHash);
 *     console.log('Destination transaction hash:', dstTxHash);
 *   }
 * };
 * ```
 */
export function useCancelLimitOrder(): UseMutationResult<CancelLimitOrderResult, Error, CancelLimitOrderParams> {
  const { sodax } = useSodaxContext();

  return useMutation<CancelLimitOrderResult, Error, CancelLimitOrderParams>({
    mutationFn: async ({ intent, spokeProvider, timeout }: CancelLimitOrderParams): Promise<CancelLimitOrderResult> => {
      return sodax.swaps.cancelLimitOrder({
        intent,
        spokeProvider,
        timeout,
      });
    },
  });
}
