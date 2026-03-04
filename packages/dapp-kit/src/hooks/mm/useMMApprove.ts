import { useSodaxContext } from '../shared/useSodaxContext';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import type { MoneyMarketParams, SpokeProvider } from '@sodax/sdk';

export type UseMMApproveParams = {
  params: MoneyMarketParams;
  spokeProvider: SpokeProvider | undefined;
};

/**
 * Hook for approving ERC20 token spending for Sodax money market actions.
 *
 * This hook manages the approval transaction, allowing the user
 * to grant the protocol permission to spend their tokens for specific money market actions
 * (such as supply, borrow, or repay). Upon successful approval, it also invalidates and
 * refetches the associated allowance status so the UI remains up-to-date.
 *
 * @returns {UseMutationResult<string, Error, UseMMApproveParams>} A React Query mutation result containing:
 *   - mutateAsync: Function to trigger the approval (see below)
 *   - isPending: Boolean indicating if approval transaction is in progress
 *   - error: Error object if the last approval failed, null otherwise
 *
 * @example
 * ```tsx
 * const { mutateAsync: approve, isPending, error } = useMMApprove();
 * await approve({ params: { token, amount: "100", action: "supply", ... }, spokeProvider });
 * ```
 *
 * @throws {Error} When:
 *   - spokeProvider is undefined or invalid
 *   - Approval transaction fails for any reason
 */
export function useMMApprove(): UseMutationResult<string, Error, UseMMApproveParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ params, spokeProvider }: UseMMApproveParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }
      const allowance = await sodax.moneyMarket.approve(params, spokeProvider, false);
      if (!allowance.ok) {
        throw allowance.error;
      }

      return allowance.value;
    },
    onSuccess: (_, { params, spokeProvider }: UseMMApproveParams) => {
      console.log('onSuccess invoked with queryKey:', [
        'mm',
        'allowance',
        spokeProvider?.chainConfig.chain.id,
        params.token,
        params.action,
      ]);
      // Invalidate allowance query to refetch updated approval status
      queryClient.invalidateQueries({
        queryKey: ['mm', 'allowance', spokeProvider?.chainConfig.chain.id, params.token, params.action],
      });
    },
  });
}
