import { useSodaxContext } from '../shared/useSodaxContext';
import type {
  CreateIntentParams,
  SolverExecutionResponse,
  Result,
  IntentErrorCode,
  Intent,
  IntentError,
  SpokeProvider,
  IntentDeliveryInfo,
} from '@sodax/sdk';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';

type CreateIntentResult = Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo], IntentError<IntentErrorCode>>;

/**
 * Hook for creating and submitting an swap intent order for cross-chain swaps.
 * Uses React Query's useMutation for better state management and caching.
 *
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for the swap
 * @returns {UseMutationResult} Mutation result object containing mutation function and state
 *
 * @example
 * ```typescript
 * const { mutateAsync: swap, isPending } = useSwap(spokeProvider);
 *
 * const handleSwap = async () => {
 *   const result = await swap({
 *     token_src: '0x...',
 *     token_src_blockchain_id: 'arbitrum',
 *     token_dst: '0x...',
 *     token_dst_blockchain_id: 'polygon',
 *     amount: '1000000000000000000',
 *     min_output_amount: '900000000000000000'
 *   });
 * };
 * ```
 */
export function useSwap(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<CreateIntentResult, Error, CreateIntentParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<CreateIntentResult, Error, CreateIntentParams>({
    mutationFn: async (params: CreateIntentParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }
      return sodax.swaps.swap({
        intentParams: params,
        spokeProvider,
      });
    },
    onSuccess: () => {
      // Invalidate balance queries to refresh both source and destination token balances
      queryClient.invalidateQueries({ queryKey: ['xBalances'] });
    },
  });
}
