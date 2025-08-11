import type { Token } from '@sodax/types';
import { type Address, parseUnits } from 'viem';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { IcxCreateRevertMigrationParams, SpokeProvider } from '@sodax/sdk';
import { useSodaxContext } from '@sodax/dapp-kit';

interface UseApproveReturn {
  approve: ({ amount }: { amount: string }) => Promise<boolean>;
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
 * const { approve, isLoading, error } = useApprove(token, spokeProvider);
 *
 * // Approve tokens for supply action
 * await approve({ amount: "100", action: "supply" });
 * ```
 */

export function useMigrationApprove(token: Token | undefined, iconAddress: string | undefined, spokeProvider: SpokeProvider | undefined): UseApproveReturn {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  const {
    mutateAsync: approve,
    isPending,
    error,
    reset: resetError,
  } = useMutation({
    mutationFn: async ({ amount }: { amount: string }) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }
      if (!token) {
        throw new Error('Token not found');
      }
      const amountToMigrate = parseUnits(amount, token.decimals);
      const revertParams = {
        amount: amountToMigrate,
        to: iconAddress as `hx${string}`,
      } satisfies IcxCreateRevertMigrationParams;

      const allowance = await sodax.migration.approve(revertParams, 'revert', spokeProvider, false);
      if (!allowance.ok) {
        throw new Error('Failed to approve tokens');
      }
      return allowance.ok;
    },
    onSuccess: () => {
      // Invalidate allowance query to refetch the new allowance
      queryClient.invalidateQueries({ queryKey: ['allowance', token?.address] });

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['allowance', token?.address] });
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
