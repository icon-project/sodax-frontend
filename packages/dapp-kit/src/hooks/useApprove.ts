import type { XToken } from '@sodax/xwagmi';
import { useSodaxContext } from './useSodaxContext';
import { useSpokeProvider } from './useSpokeProvider';
import type { Address, SpokeChainId } from '@sodax/sdk';
import { parseUnits } from 'viem';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
        spokeProvider.chainConfig.addresses.assetManager,
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
