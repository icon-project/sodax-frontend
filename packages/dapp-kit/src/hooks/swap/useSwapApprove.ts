import { useSodaxContext } from '../shared/useSodaxContext.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateIntentParams, CreateLimitOrderParams } from '@sodax/sdk';
import type { GetWalletProviderType, SpokeChainKey } from '@sodax/types';

interface UseApproveReturn {
  approve: ({ params }: { params: CreateIntentParams | CreateLimitOrderParams }) => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
}

export function useSwapApprove<K extends SpokeChainKey>(
  params: CreateIntentParams | CreateLimitOrderParams | undefined,
  srcChainKey: K | undefined,
  walletProvider: GetWalletProviderType<K> | undefined,
): UseApproveReturn {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  const {
    mutateAsync: approve,
    isPending,
    error,
    reset: resetError,
  } = useMutation({
    mutationFn: async ({ params }: { params: CreateIntentParams | CreateLimitOrderParams | undefined }) => {
      if (!srcChainKey || !walletProvider) {
        throw new Error('Source chain key and wallet provider are required');
      }
      if (!params) {
        throw new Error('Swap Params not found');
      }

      const allowance = await sodax.swaps.approve({
        params: params as CreateIntentParams,
        raw: false,
        walletProvider,
      });
      if (!allowance.ok) {
        throw new Error('Failed to approve input token');
      }
      return allowance.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowance', params] });
    },
  });

  return { approve, isLoading: isPending, error, resetError };
}
