import { useSodaxContext } from '../shared/useSodaxContext';
import type { XToken } from '@sodax/types';
import { parseUnits } from 'viem';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { MoneyMarketAction, SpokeProvider } from '@sodax/sdk';

/**
 * Hook for approving token spending for money market actions.
 *
 * This hook provides a mutation function to approve token spending for money market operations.
 * Returns the standard React Query useMutation result.
 *
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider instance for the chain
 *
 * @returns {UseMutationResult<boolean, Error, { token: XToken; amount: string; action: MoneyMarketAction }>} Standard React Query mutation result with:
 *   - mutateAsync: Function to approve token spending for money market actions
 *   - isPending: Boolean indicating if the approval is in progress
 *   - error: Error object if the approval failed
 *   - reset: Function to reset the error state
 *   - Other standard React Query mutation properties
 *
 * @example
 * ```typescript
 * const { mutateAsync: approve, isPending, error } = useMMApprove(spokeProvider);
 *
 * // Approve tokens for supply action
 * await approve({
 *   token: { address: '0x...', decimals: 18, symbol: 'USDC', ... },
 *   amount: "100",
 *   action: "supply"
 * });
 * ```
 */
export function useMMApprove(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<boolean, Error, { token: XToken; amount: string; action: MoneyMarketAction }> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token, amount, action }: { token: XToken; amount: string; action: MoneyMarketAction }) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }
      const actionBasedDecimals = action === 'withdraw' || action === 'borrow' ? 18 : token.decimals; // withdraw and borrow actions are in aToken decimals
      const allowance = await sodax.moneyMarket.approve(
        {
          token: token.address,
          amount: parseUnits(amount, actionBasedDecimals),
          action,
        },
        spokeProvider,
      );
      if (!allowance.ok) {
        throw new Error('Failed to approve tokens');
      }
      return allowance.ok;
    },
    onSuccess: (_, { token }) => {
      // Invalidate allowance query to refetch the new allowance
      queryClient.invalidateQueries({ queryKey: ['allowance', token.address] });
    },
  });
}
