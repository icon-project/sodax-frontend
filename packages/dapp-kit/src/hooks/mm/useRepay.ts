import type { HubTxHash, MoneyMarketRepayActionParams, SpokeTxHash } from '@sodax/sdk';
import type { GetWalletProviderType, Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseRepayVars<K extends SpokeChainKey> = Pick<
  MoneyMarketRepayActionParams<K>,
  'params' | 'skipSimulation' | 'timeout'
>;

type RepayResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for repaying a borrow in the Sodax money market protocol.
 *
 * Mirrors the {@link useSwap} pattern — closes over the source `chainKey` and `walletProvider`
 * captured at hook-call time and returns the SDK `Result` as-is. Callers branch on `data?.ok`.
 */
export function useRepay<K extends SpokeChainKey>(
  srcChainKey: K | undefined,
  walletProvider: GetWalletProviderType<K> | undefined,
): UseMutationResult<RepayResult, Error, UseRepayVars<K>> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<RepayResult, Error, UseRepayVars<K>>({
    mutationFn: async (vars) => {
      if (!srcChainKey || !walletProvider) {
        throw new Error('Source chain key and wallet provider are required');
      }
      return sodax.moneyMarket.repay({ ...vars, walletProvider });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['mm', 'userReservesData', params.srcChainKey, params.srcAddress] });
      queryClient.invalidateQueries({
        queryKey: ['mm', 'userFormattedSummary', params.srcChainKey, params.srcAddress],
      });
      queryClient.invalidateQueries({ queryKey: ['mm', 'aTokensBalances'] });
      queryClient.invalidateQueries({ queryKey: ['mm', 'allowance', params.srcChainKey, params.token, params.action] });
      queryClient.invalidateQueries({ queryKey: ['xBalances', params.srcChainKey] });
    },
  });
}
