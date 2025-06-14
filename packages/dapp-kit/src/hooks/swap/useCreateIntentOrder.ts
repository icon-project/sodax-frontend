import { useSodaxContext } from '../shared/useSodaxContext';
import type {
  CreateIntentParams,
  SpokeChainId,
  IntentExecutionResponse,
  Result,
  IntentSubmitErrorCode,
  Intent,
  PacketData,
  IntentSubmitError,
} from '@sodax/sdk';
import { useSpokeProvider } from '../provider/useSpokeProvider';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

type CreateIntentResult = Result<
  [IntentExecutionResponse, Intent, PacketData],
  IntentSubmitError<IntentSubmitErrorCode>
>;

/**
 * Hook for creating and submitting an intent order for cross-chain swaps.
 * Uses React Query's useMutation for better state management and caching.
 *
 * @param {SpokeChainId} chainId - The source chain ID where the swap will originate
 * @returns {UseMutationResult} Mutation result object containing mutation function and state
 *
 * @example
 * ```typescript
 * const { mutateAsync: createIntent, isPending } = useCreateIntentOrder('0xa4b1.arbitrum');
 *
 * const handleSwap = async () => {
 *   const result = await createIntent({
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
export function useCreateIntentOrder(
  chainId: SpokeChainId,
): UseMutationResult<CreateIntentResult, Error, CreateIntentParams> {
  const { sodax } = useSodaxContext();
  const spokeProvider = useSpokeProvider(chainId);

  return useMutation<CreateIntentResult, Error, CreateIntentParams>({
    mutationFn: async (params: CreateIntentParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }
      return sodax.solver.createAndSubmitIntent(params, spokeProvider);
    },
  });
}
