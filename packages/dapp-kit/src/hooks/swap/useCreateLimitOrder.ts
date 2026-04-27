import { useSodaxContext } from '../shared/useSodaxContext.js';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type {
  CreateLimitOrderParams,
  SolverExecutionResponse,
  Intent,
  IntentDeliveryInfo,
} from '@sodax/sdk';
import type { GetWalletProviderType, Result, SpokeChainKey } from '@sodax/types';

type CreateLimitOrderResult = Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo]>;

export function useCreateLimitOrder<K extends SpokeChainKey>(
  srcChainKey: K | undefined,
  walletProvider: GetWalletProviderType<K> | undefined,
): UseMutationResult<CreateLimitOrderResult, Error, CreateLimitOrderParams> {
  const { sodax } = useSodaxContext();

  return useMutation<CreateLimitOrderResult, Error, CreateLimitOrderParams>({
    mutationFn: async (params: CreateLimitOrderParams) => {
      if (!srcChainKey || !walletProvider) {
        throw new Error('Source chain key and wallet provider are required');
      }
      return sodax.swaps.createLimitOrder({ params, raw: false, walletProvider });
    },
  });
}
