// packages/dapp-kit/src/hooks/staking/useCancelUnstake.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { CancelUnstakeParams, SpokeProvider } from '@sodax/sdk';

export function useCancelUnstake(spokeProvider: SpokeProvider | undefined) {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CancelUnstakeParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not available');
      }

      const result = await sodax.staking.cancelUnstake(params, spokeProvider);
      if (!result.ok) {
        throw new Error(`Cancel unstake failed: ${result.error.code}`);
      }

      return result.value;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['stakingInfo'] });
      queryClient.invalidateQueries({ queryKey: ['unstakingInfo'] });
      queryClient.invalidateQueries({ queryKey: ['unstakingInfoWithPenalty'] });
    },
  });
}
