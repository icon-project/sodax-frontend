import { useSodaxContext } from '../shared/useSodaxContext';
import { useSpokeProvider } from '../provider/useSpokeProvider';
import type { SpokeChainId, XToken } from '@sodax/types';
import { parseUnits } from 'viem';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MoneyMarketAction } from '@sodax/sdk';

interface UseApproveReturn {
  approve: ({ amount, action }: { amount: string; action: MoneyMarketAction }) => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
}

export function useApprove(token: XToken): UseApproveReturn {
  const { sodax } = useSodaxContext();
  const spokeProvider = useSpokeProvider(token.xChainId as SpokeChainId);
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
      queryClient.invalidateQueries({ queryKey: ['allowance', token.address] });
    },
  });

  return {
    approve,
    isLoading: isPending,
    error: error,
    resetError,
  };
}
