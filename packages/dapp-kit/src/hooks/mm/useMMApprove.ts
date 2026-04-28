import type { MoneyMarketParams, TxReturnType } from '@sodax/sdk';
import type { GetWalletProviderType, Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseMMApproveVars<K extends SpokeChainKey> = {
  params: MoneyMarketParams<K>;
};

/**
 * React hook for approving ERC-20 token spending (or trustline establishment) for a Sodax money
 * market action. Mirrors the {@link useSwap} pattern — closes over the source `chainKey` and
 * `walletProvider` and returns the SDK `Result` as-is.
 *
 * On success, invalidates the matching `['mm', 'allowance', srcChainKey, token, action]` query.
 */
export function useMMApprove<K extends SpokeChainKey>(
  srcChainKey: K | undefined,
  walletProvider: GetWalletProviderType<K> | undefined,
): UseMutationResult<Result<TxReturnType<K, false>>, Error, UseMMApproveVars<K>> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<Result<TxReturnType<K, false>>, Error, UseMMApproveVars<K>>({
    mutationFn: async ({ params }) => {
      if (!srcChainKey || !walletProvider) {
        throw new Error('Source chain key and wallet provider are required');
      }
      return sodax.moneyMarket.approve({ params, walletProvider });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({
        queryKey: ['mm', 'allowance', params.srcChainKey, params.token, params.action],
      });
    },
  });
}
