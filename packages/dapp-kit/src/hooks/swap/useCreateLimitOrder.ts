import { useSodaxContext } from '../shared/useSodaxContext';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type {
  CreateLimitOrderParams,
  SolverExecutionResponse,
  Intent,
  IntentError,
  IntentErrorCode,
  IntentDeliveryInfo,
  Result,
  SpokeProvider,
} from '@sodax/sdk';

type CreateLimitOrderResult = Result<
  [SolverExecutionResponse, Intent, IntentDeliveryInfo],
  IntentError<IntentErrorCode>
>;

/**
 * Hook for creating a limit order intent (no deadline, must be cancelled manually by user).
 * Uses React Query's useMutation for better state management and caching.
 *
 * Limit orders remain active until manually cancelled by the user. Unlike swaps, limit orders
 * do not have a deadline (deadline is automatically set to 0n).
 *
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for creating the limit order
 * @returns {UseMutationResult} Mutation result object containing mutation function and state
 *
 * @example
 * ```typescript
 * const { mutateAsync: createLimitOrder, isPending } = useCreateLimitOrder(spokeProvider);
 *
 * const handleCreateLimitOrder = async () => {
 *   const result = await createLimitOrder({
 *     inputToken: '0x...',
 *     outputToken: '0x...',
 *     inputAmount: 1000000000000000000n,
 *     minOutputAmount: 900000000000000000n,
 *     allowPartialFill: false,
 *     srcChain: '0xa4b1.arbitrum',
 *     dstChain: '0x89.polygon',
 *     srcAddress: '0x...',
 *     dstAddress: '0x...',
 *     solver: '0x0000000000000000000000000000000000000000',
 *     data: '0x'
 *   });
 *
 *   if (result.ok) {
 *     const [solverExecutionResponse, intent, intentDeliveryInfo] = result.value;
 *     console.log('Limit order created:', intent);
 *     console.log('Intent hash:', solverExecutionResponse.intent_hash);
 *   }
 * };
 * ```
 */
export function useCreateLimitOrder(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<CreateLimitOrderResult, Error, CreateLimitOrderParams> {
  const { sodax } = useSodaxContext();

  return useMutation<CreateLimitOrderResult, Error, CreateLimitOrderParams>({
    mutationFn: async (params: CreateLimitOrderParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }
      return sodax.swaps.createLimitOrder({
        intentParams: params,
        spokeProvider,
      });
    },
  });
}
