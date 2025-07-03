import { useSodaxContext } from '../shared/useSodaxContext';
import {
  type CreateIntentParams,
  type SpokeChainId,
  type IntentExecutionResponse,
  type Result,
  type IntentSubmitErrorCode,
  type Intent,
  type PacketData,
  type IntentSubmitError,
  type SpokeProvider,
  SPOKE_CHAIN_IDS,
} from '@sodax/sdk';
import { useSpokeProvider } from '../provider/useSpokeProvider';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

type CreateIntentResult = Result<
  [IntentExecutionResponse, Intent, PacketData],
  IntentSubmitError<IntentSubmitErrorCode>
>;

export function isSpokeChainId(value: unknown): value is SpokeChainId {
  return typeof value === 'string' && SPOKE_CHAIN_IDS.includes(value as SpokeChainId);
}

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
  chainIdOrProvider: SpokeChainId | SpokeProvider | undefined,
): UseMutationResult<CreateIntentResult, Error, CreateIntentParams> {
  const { sodax } = useSodaxContext();

  const spokeProviderFromHook = useSpokeProvider(isSpokeChainId(chainIdOrProvider) ? chainIdOrProvider : undefined);
  // Use provided provider if it's a SpokeProvider instance, otherwise use the hook result
  const spokeProvider = isSpokeChainId(chainIdOrProvider) ? spokeProviderFromHook : chainIdOrProvider;

  return useMutation<CreateIntentResult, Error, CreateIntentParams>({
    mutationFn: async (params: CreateIntentParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }
      return sodax.solver.createAndSubmitIntent(params, spokeProvider);
    },
  });
}
