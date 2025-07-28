import { useSodaxContext } from '../shared/useSodaxContext';
import type { XToken } from '@sodax/types';
import { parseUnits } from 'viem';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MoneyMarketAction, SpokeProvider } from '@sodax/sdk';

interface UseApproveReturn {
  approve: ({ amount, action }: { amount: string; action: MoneyMarketAction }) => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
}

/**
 * Hook for approving token spending for money market actions
 * @param token The token to approve spending for
 * @param spokeProvider The spoke provider instance for the chain
 * @returns Object containing approve function, loading state, error state and reset function
 * @example
 * ```tsx
 * const { approve, isLoading, error } = useMMApprove(token, spokeProvider);
 *
 * // Approve tokens for supply action
 * await approve({ amount: "100", action: "supply" });
 * ```
 */

export function useMMApprove(token: XToken, spokeProvider: SpokeProvider | undefined): UseApproveReturn {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  const {
    mutateAsync: approve,
    isPending,
    error,
    reset: resetError,
  } = useMutation({
    mutationFn: async ({ amount, action }: { amount: string; action: MoneyMarketAction }) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }
      const allowance = await sodax.moneyMarket.approve(
        {
          token: token.address,
          amount: parseUnits(amount, token.decimals),
          action,
        },
        spokeProvider,
      );
      if (!allowance.ok) {
        throw new Error('Failed to approve tokens');
      }
      return allowance.ok;
    },
    onSuccess: () => {
      // Invalidate allowance query to refetch the new allowance
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['allowance', token.address],
          exact: false,
        });
      }, 1000);
    },
  });

  return {
    approve,
    isLoading: isPending,
    error: error,
    resetError,
  };
}
