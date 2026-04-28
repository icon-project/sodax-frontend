import type { HubTxHash, MoneyMarketSupplyActionParams, SpokeTxHash } from '@sodax/sdk';
import type { GetWalletProviderType, Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseSupplyVars<K extends SpokeChainKey> = Pick<
  MoneyMarketSupplyActionParams<K>,
  'params' | 'skipSimulation' | 'timeout'
>;

type SupplyResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for supplying tokens to the Sodax money market protocol.
 *
 * Mirrors the {@link useSwap} pattern: closes over the source `chainKey` and `walletProvider`
 * captured at hook-call time and returns the SDK `Result` as-is — callers branch on `data?.ok`.
 *
 * @example
 * ```tsx
 * const walletProvider = useWalletProvider(chainKey);
 * const { mutateAsync: supply } = useSupply(chainKey, walletProvider);
 * const result = await supply({ params: supplyParams });
 * if (result.ok) { ... }
 * ```
 */
export function useSupply<K extends SpokeChainKey>(
  srcChainKey: K | undefined,
  walletProvider: GetWalletProviderType<K> | undefined,
): UseMutationResult<SupplyResult, Error, UseSupplyVars<K>> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<SupplyResult, Error, UseSupplyVars<K>>({
    mutationFn: async (vars) => {
      if (!srcChainKey || !walletProvider) {
        throw new Error('Source chain key and wallet provider are required');
      }
      return sodax.moneyMarket.supply({ ...vars, walletProvider });
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
