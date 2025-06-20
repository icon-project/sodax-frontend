import { useSodaxContext } from '../shared/useSodaxContext';
import { useSpokeProvider } from '../provider/useSpokeProvider';
import type { SpokeChainId, XToken } from '@sodax/types';
import { parseUnits } from 'viem';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Address } from '@sodax/sdk';

interface UseApproveReturn {
  approve: (amount: string) => Promise<boolean>;
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
    mutationFn: async (amount: string) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }
      const allowance = await sodax.moneyMarket.approve(
        token.address as Address,
        parseUnits(amount, token.decimals),
        spokeProvider.chainConfig.addresses.assetManager as Address,
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
    error: error as Error | null,
    resetError,
  };
}
