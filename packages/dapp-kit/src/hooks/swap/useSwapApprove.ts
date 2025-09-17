import { useSodaxContext } from '../shared/useSodaxContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateIntentParams, SpokeProvider } from '@sodax/sdk';

interface UseApproveReturn {
  approve: ({ params }: { params: CreateIntentParams }) => Promise<boolean>;
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

export function useSwapApprove(
  params: CreateIntentParams | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseApproveReturn {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  const {
    mutateAsync: approve,
    isPending,
    error,
    reset: resetError,
  } = useMutation({
    mutationFn: async ({ params }: { params: CreateIntentParams | undefined }) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }
      if (!params) {
        throw new Error('Swap Params not found');
      }

      const allowance = await sodax.solver.approve({
        intentParams: params,
        spokeProvider,
      });
      if (!allowance.ok) {
        throw new Error('Failed to approve input token');
      }
      return allowance.ok;
    },
    onSuccess: () => {
      // Invalidate allowance query to refetch the new allowance
      queryClient.invalidateQueries({ queryKey: ['allowance', params] });
    },
  });

  return {
    approve,
    isLoading: isPending,
    error: error,
    resetError,
  };
}
