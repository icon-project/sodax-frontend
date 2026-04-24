import { useSodaxContext } from '../shared/useSodaxContext.js';
import type { Intent } from '@sodax/sdk';
import type { GetWalletProviderType, Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

type CancelLimitOrderParams<K extends SpokeChainKey = SpokeChainKey> = {
  srcChainKey: K;
  walletProvider: GetWalletProviderType<K>;
  intent: Intent;
  timeout?: number;
};

type CancelLimitOrderResult = Result<[string, string]>;

export function useCancelLimitOrder(): UseMutationResult<CancelLimitOrderResult, Error, CancelLimitOrderParams> {
  const { sodax } = useSodaxContext();

  return useMutation<CancelLimitOrderResult, Error, CancelLimitOrderParams>({
    mutationFn: ({ srcChainKey, walletProvider, intent, timeout }) =>
      sodax.swaps.cancelLimitOrder({ srcChainKey, walletProvider, intent, timeout }),
  });
}
