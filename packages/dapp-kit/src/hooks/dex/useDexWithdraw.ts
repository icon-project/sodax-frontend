import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { SpokeProvider, SpokeTxHash, HubTxHash, CreateAssetWithdrawParams } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseDexWithdrawParams = {
  params: CreateAssetWithdrawParams;
  spokeProvider: SpokeProvider;
};

/**
 * React hook to provide a mutation for withdrawing assets from a DEX pool.
 *
 * This hook returns a mutation result object valid for use with React Query.
 * The mutation function expects an object with the withdrawal parameters and a SpokeProvider,
 * and triggers the withdrawal operation on the DEX. On success, it invalidates the relevant
 * ['dex', 'poolBalances'] query to fetch the updated balances.
 *
 * @returns {UseMutationResult<[SpokeTxHash, HubTxHash], Error, UseDexWithdrawParams>}
 *   Mutation result object. Use its properties to:
 *   - Call `mutateAsync({ params, spokeProvider })` to perform the withdrawal.
 *   - Track progress with `isPending`.
 *   - Access any `error` encountered during the mutation.
 *
 * @example
 * const { mutateAsync: withdraw, isPending, error } = useDexWithdraw();
 * await withdraw({ params, spokeProvider });
 */
export function useDexWithdraw(): UseMutationResult<[SpokeTxHash, HubTxHash], Error, UseDexWithdrawParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ params, spokeProvider }: UseDexWithdrawParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider is required');
      }
      // Execute withdraw
      const withdrawResult = await sodax.dex.assetService.withdraw({
        params,
        spokeProvider,
      });

      if (!withdrawResult.ok) {
        throw new Error(`Withdraw failed: ${withdrawResult.error.code}`);
      }

      return withdrawResult.value;
    },
    onSuccess: () => {
      // Invalidate balances query to refetch after withdraw
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances'] });
    },
  });
}
