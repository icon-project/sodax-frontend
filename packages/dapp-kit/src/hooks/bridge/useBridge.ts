import { useSodaxContext } from '../shared/useSodaxContext';
import type { BridgeParams } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { SpokeProvider } from '@sodax/sdk';

type BridgeResult = {
  spokeTxHash: string;
  hubTxHash: string;
};

/**
 * Hook for executing bridge transactions to transfer tokens between chains.
 * Uses React Query's useMutation for better state management and caching.
 *
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for the bridge
 * @returns {UseMutationResult} Mutation result object containing mutation function and state
 *
 * @example
 * ```typescript
 * const { mutateAsync: bridge, isPending } = useBridge(spokeProvider);
 *
 * const handleBridge = async () => {
 *   const result = await bridge({
 *     srcChainId: '0x2105.base',
 *     srcAsset: '0x...',
 *     amount: 1000n,
 *     dstChainId: '0x89.polygon',
 *     dstAsset: '0x...',
 *     recipient: '0x...'
 *   });
 *
 *   console.log('Bridge transaction hashes:', {
 *     spokeTxHash: result.spokeTxHash,
 *     hubTxHash: result.hubTxHash
 *   });
 * };
 * ```
 */
export function useBridge(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<BridgeResult, Error, BridgeParams> {
  const { sodax } = useSodaxContext();

  return useMutation<BridgeResult, Error, BridgeParams>({
    mutationFn: async (params: BridgeParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      const result = await sodax.bridge.bridge(params, spokeProvider);

      if (!result.ok) {
        throw new Error(`Bridge failed: ${result.error.code}`);
      }

      const [spokeTxHash, hubTxHash] = result.value;
      return { spokeTxHash, hubTxHash };
    },
  });
}
