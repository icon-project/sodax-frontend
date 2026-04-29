import type { ClLiquidityDecreaseLiquidityAction, HubTxHash, SpokeTxHash } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useDecreaseLiquidity}. Generic over `K extends SpokeChainKey`
 * (defaults to the full union). Sophisticated callers can lock K at the hook call site to narrow
 * the `walletProvider` and `params.srcChainKey` types.
 */
export type UseDecreaseLiquidityVars<K extends SpokeChainKey = SpokeChainKey> = Omit<
  ClLiquidityDecreaseLiquidityAction<K, false>,
  'raw'
>;

type DecreaseLiquidityResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for decreasing liquidity in an existing concentrated-liquidity position. Pure
 * mutation: all inputs (params, walletProvider) are passed to `mutate({...})`. Returns the SDK
 * `Result<T>` as-is; callers branch on `data?.ok`.
 */
export function useDecreaseLiquidity<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  DecreaseLiquidityResult,
  Error,
  UseDecreaseLiquidityVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<DecreaseLiquidityResult, Error, UseDecreaseLiquidityVars<K>>({
    mutationFn: async vars => {
      return sodax.dex.clService.decreaseLiquidity({ ...vars, raw: false });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['dex', 'positionInfo'] });
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolData', params.poolKey] });
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances', params.srcChainKey, params.srcAddress] });
    },
  });
}
