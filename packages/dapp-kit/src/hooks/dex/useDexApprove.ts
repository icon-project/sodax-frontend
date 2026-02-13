import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { SpokeProvider, CreateAssetDepositParams, SpokeTxHash } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseDexApproveParams = {
  params: CreateAssetDepositParams;
  spokeProvider: SpokeProvider;
};

/**
 * React hook for performing a DEX token allowance approval transaction.
 *
 * Returns a mutation object that allows explicitly triggering a token approval
 * for a DEX deposit, using the specified approval parameters and spoke provider.
 * On successful approval, the related allowance query is invalidated and refetched
 * for consistent UI state.
 *
 * @returns {UseMutationResult<SpokeTxHash, Error, UseDexApproveParams>}
 *   React Query mutation result for the approval operation. Use `mutateAsync` with
 *   an object of shape `{ params, spokeProvider }` to initiate approval.
 *
 * @example
 * ```typescript
 * const { mutateAsync: approve, isPending, error } = useDexApprove();
 * await approve({ params: { asset, amount, poolToken }, spokeProvider });
 * ```
 *
 * @remarks
 * - Throws if called without both a valid `params` and `spokeProvider`.
 * - On approval success, the query for ['dex', 'allowance'] is invalidated/refetched.
 */
export function useDexApprove(): UseMutationResult<SpokeTxHash, Error, UseDexApproveParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ params, spokeProvider }: UseDexApproveParams) => {
      const approveResult = await sodax.dex.assetService.approve({
        params,
        spokeProvider,
        raw: false,
      });

      if (!approveResult.ok) {
        throw new Error('Approval failed');
      }

      return approveResult.value;
    },
    onSuccess: () => {
      // Invalidate allowance query to refetch the new allowance
      queryClient.invalidateQueries({ queryKey: ['dex', 'allowance'] });
    },
  });
}
