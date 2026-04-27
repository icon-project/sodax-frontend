import { useSodaxContext } from '../shared/useSodaxContext.js';
import type { Intent } from '@sodax/sdk';
import type { GetWalletProviderType, Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

type CancelIntentParams<K extends SpokeChainKey = SpokeChainKey> = {
  srcChainKey: K;
  walletProvider: GetWalletProviderType<K>;
  intent: Intent;
};

type CancelIntentResult = Result<[string, string]>;

export function useCancelSwap(): UseMutationResult<CancelIntentResult, Error, CancelIntentParams> {
  const { sodax } = useSodaxContext();

  return useMutation<CancelIntentResult, Error, CancelIntentParams>({
    mutationFn: ({ srcChainKey, walletProvider, intent }) =>
      sodax.swaps.cancelIntent({ srcChainKey, walletProvider, intent }),
  });
}
