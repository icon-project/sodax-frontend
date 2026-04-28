import type { HubTxHash, MoneyMarketWithdrawActionParams, SpokeTxHash } from '@sodax/sdk';
import type { GetWalletProviderType, Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseWithdrawVars<K extends SpokeChainKey> = Pick<
  MoneyMarketWithdrawActionParams<K>,
  'params' | 'skipSimulation' | 'timeout'
>;

type WithdrawResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for withdrawing supplied tokens from the Sodax money market protocol.
 *
 * Mirrors the {@link useSwap} pattern — closes over the source `chainKey` and `walletProvider`
 * captured at hook-call time and returns the SDK `Result` as-is. Callers branch on `data?.ok`.
 */
export function useWithdraw<K extends SpokeChainKey>(
  srcChainKey: K | undefined,
  walletProvider: GetWalletProviderType<K> | undefined,
): UseMutationResult<WithdrawResult, Error, UseWithdrawVars<K>> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<WithdrawResult, Error, UseWithdrawVars<K>>({
    mutationFn: async (vars) => {
      if (!srcChainKey || !walletProvider) {
        throw new Error('Source chain key and wallet provider are required');
      }
      return sodax.moneyMarket.withdraw({ ...vars, walletProvider });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['mm', 'userReservesData', params.srcChainKey, params.srcAddress] });
      queryClient.invalidateQueries({
        queryKey: ['mm', 'userFormattedSummary', params.srcChainKey, params.srcAddress],
      });
      queryClient.invalidateQueries({ queryKey: ['mm', 'aTokensBalances'] });
      const balanceChains = new Set([params.srcChainKey, params.toChainId ?? params.srcChainKey]);
      for (const chainKey of balanceChains) {
        queryClient.invalidateQueries({ queryKey: ['xBalances', chainKey] });
      }
    },
  });
}
