import type { HubTxHash, MoneyMarketSupplyActionParams, SpokeTxHash } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useSupply}. Generic over `K extends SpokeChainKey` (defaults to
 * the full union). Sophisticated callers can lock K at the hook call site to narrow the
 * `walletProvider` and `params.srcChainKey` types.
 */
export type UseSupplyVars<K extends SpokeChainKey = SpokeChainKey> = Omit<
  MoneyMarketSupplyActionParams<K, false>,
  'raw'
>;

type SupplyResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for supplying tokens to the Sodax money market protocol.
 *
 * Pure mutation: all inputs (params, walletProvider, optional skipSimulation/timeout) are passed
 * to `mutate({...})`. The hook itself takes no arguments. Returns the SDK `Result<T>` as-is;
 * callers branch on `data?.ok`.
 *
 * @example
 * ```tsx
 * const walletProvider = useWalletProvider(chainKey);
 * const { mutateAsync: supply } = useSupply();
 * if (!walletProvider) return;
 * const result = await supply({ params: supplyParams, walletProvider });
 * if (result.ok) { ... }
 * ```
 */
export function useSupply<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  SupplyResult,
  Error,
  UseSupplyVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<SupplyResult, Error, UseSupplyVars<K>>({
    mutationFn: async (vars) => {
      return sodax.moneyMarket.supply({ ...vars, raw: false });
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
