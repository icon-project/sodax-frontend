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

/**
 * Hook for creating and submitting an intent order for cross-chain swaps.
 *
 * This hook provides functionality to create and submit intent orders to the solver
 * for executing cross-chain token swaps.
 *
 * @param {SpokeChainId} chainId - The source chain ID where the swap will originate
 *
 * @returns {{ createIntentOrder: (params: CreateIntentParams) => Promise<Result<[IntentExecutionResponse, Intent, PacketData], IntentSubmitError<IntentSubmitErrorCode>> }}
 * An object containing:
 *   - createIntentOrder: Function to create and submit the intent order
 *
 * @example
 * ```typescript
 * const { createIntentOrder } = useCreateIntentOrder('0xa4b1.arbitrum');
 *
 * const handleSwap = async () => {
 *   const result = await createIntentOrder({
 *     token_src: '0x...',
 *     token_src_blockchain_id: 'arbitrum',
 *     token_dst: '0x...',
 *     token_dst_blockchain_id: 'polygon',
 *     amount: '1000000000000000000',
 *     min_output_amount: '900000000000000000'
 *   });
 *
 *   if (result.ok) {
 *     console.log('Intent created:', result.value);
 *   }
 * };
 * ```
 *
 * @remarks
 * - Requires a spoke provider to be available for the specified chain
 * - Throws an error if spoke provider is not found
 * - Uses the Sodax solver for creating and submitting intents
 */

export function useCreateIntentOrder(chainId: SpokeChainId): {
  createIntentOrder: (
    params: CreateIntentParams,
  ) => Promise<Result<[IntentExecutionResponse, Intent, PacketData], IntentSubmitError<IntentSubmitErrorCode>>>;
} {
  const { sodax } = useSodaxContext();
  const spokeProvider = useSpokeProvider(chainId);

  const createIntentOrder = async (createIntentParams: CreateIntentParams) => {
    if (!spokeProvider) {
      throw new Error('Spoke provider not found');
    }
    return sodax.solver.createAndSubmitIntent(createIntentParams, spokeProvider);
  };

  return { createIntentOrder };
}
