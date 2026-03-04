import { useSodaxContext } from '../shared/useSodaxContext';
import type { Intent, Result, SpokeProvider, TxReturnType } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

type CancelIntentParams = {
  intent: Intent;
  raw?: boolean;
};

type CancelIntentResult = Result<TxReturnType<SpokeProvider, boolean>>;

/**
 * Hook for canceling a swap intent order.
 * Uses React Query's useMutation for better state management and caching.
 *
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for canceling the intent
 * @returns {UseMutationResult} Mutation result object containing mutation function and state
 *
 * @example
 * ```typescript
 * const { mutateAsync: cancelSwap, isPending } = useCancelSwap(spokeProvider);
 *
 * const handleCancelSwap = async () => {
 *   const result = await cancelSwap({
 *     intent: intentObject,
 *     raw: false // optional, defaults to false
 *   });
 * };
 * ```
 */
export function useCancelSwap(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<CancelIntentResult, Error, CancelIntentParams> {
  const { sodax } = useSodaxContext();

  return useMutation<CancelIntentResult, Error, CancelIntentParams>({
    mutationFn: async ({ intent, raw = false }: CancelIntentParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }
      return sodax.swaps.cancelIntent(intent, spokeProvider, raw);
    },
  });
}
