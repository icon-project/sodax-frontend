import { useSodaxContext } from '../shared/useSodaxContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MoneyMarketParams, SpokeProvider } from '@sodax/sdk';

/**
 * Hook for approving tokens for money market actions.
 *
 * This hook allows a user to grant the money market contract permission to spend their tokens.
 * It handles the approval transaction lifecycle and uses React Query for state and cache management.
 *
 * @returns A mutation result object with:
 *   - mutateAsync: Function to call to perform the approval transaction
 *   - isPending: Boolean indicating if the transaction is in flight
 *   - error: Error object if the transaction failed, otherwise null
 *   - reset: Function to reset mutation state
 *
 * @example
 * ```typescript
 * const { mutateAsync: approve, isPending, error } = useMMApprove();
 * await approve({
 *   params: {
 *     token: '0x...',
 *     amount: parseUnits('1000', 18),
 *     action: 'approve',
 *   },
 *   spokeProvider,
 * });
 * ```
 *
 * @throws {Error} If approval transaction fails.
 */

export function useMMApprove() {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { params: MoneyMarketParams; spokeProvider: SpokeProvider }>({
    mutationFn: async ({ params, spokeProvider }) => {
      const allowance = await sodax.moneyMarket.approve(params, spokeProvider);

      if (!allowance.ok) {
        throw allowance.error;
      }

      return allowance.ok;
    },
    onSuccess: (_, { params }) => {
      // Invalidate allowance query to refetch the new allowance
      queryClient.invalidateQueries({ queryKey: ['allowance', params] });
    },
  });
}
