import { useSodaxContext } from '../shared/useSodaxContext.js';
import type { CreateIntentParams, SolverExecutionResponse, Intent, IntentDeliveryInfo } from '@sodax/sdk';
import type { GetWalletProviderType, Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';

type CreateIntentResult = Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo]>;

export function useSwap<K extends SpokeChainKey>(
  srcChainKey: K | undefined,
  walletProvider: GetWalletProviderType<K> | undefined,
): UseMutationResult<CreateIntentResult, Error, CreateIntentParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<CreateIntentResult, Error, CreateIntentParams>({
    mutationFn: async (params: CreateIntentParams) => {
      if (!srcChainKey || !walletProvider) {
        throw new Error('Source chain key and wallet provider are required');
      }
      return sodax.swaps.swap({ params, raw: false, walletProvider });
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['xBalances', params.srcChainKey] });
      queryClient.invalidateQueries({ queryKey: ['xBalances', params.dstChainKey] });
    },
  });
}
