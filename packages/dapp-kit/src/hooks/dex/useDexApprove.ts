import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { SpokeProvider, OriginalAssetAddress } from '@sodax/sdk';
import type { Address } from 'viem';
import { useSodaxContext } from '../shared/useSodaxContext';

interface ApproveParams {
  asset: OriginalAssetAddress;
  amount: bigint;
  poolToken: Address;
}

/**
 * Hook for approving token spending for DEX operations.
 *
 * This hook handles the approval of tokens for deposit operations.
 * It automatically invalidates the allowance query after successful approval.
 *
 * @param {SpokeProvider | null} spokeProvider - The spoke provider for the chain
 * @returns {UseMutationResult<boolean, Error, ApproveParams>} Mutation result with approve function
 *
 * @example
 * ```typescript
 * const { mutateAsync: approve, isPending, error } = useDexApprove(spokeProvider);
 *
 * await approve({
 *   asset,
 *   amount: parseUnits('100', 18),
 *   poolToken,
 * });
 * ```
 */
export function useDexApprove(spokeProvider: SpokeProvider | null): UseMutationResult<boolean, Error, ApproveParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ asset, amount, poolToken }: ApproveParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider is required');
      }

      const approveResult = await sodax.dex.assetService.approve({
        depositParams: {
          asset,
          amount,
          poolToken,
        },
        spokeProvider,
        raw: false,
      });

      if (!approveResult.ok) {
        throw new Error('Approval failed');
      }

      return approveResult.ok;
    },
    onSuccess: () => {
      // Invalidate allowance query to refetch the new allowance
      queryClient.invalidateQueries({ queryKey: ['dex', 'allowance'] });
    },
  });
}
