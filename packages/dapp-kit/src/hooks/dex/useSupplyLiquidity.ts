import type { ClIncreaseLiquidityParams, ClSupplyParams, HubTxHash, SpokeTxHash } from '@sodax/sdk';
import type { GetWalletProviderType, Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';
import type { UseCreateSupplyLiquidityParamsResult } from './useCreateSupplyLiquidityParams.js';

/**
 * Mutation variables for {@link useSupplyLiquidity}. Generic over `K extends SpokeChainKey`
 * (defaults to the full union). The hook fans out internally to either
 * `clService.increaseLiquidity` (when `params.tokenId` + `params.isValidPosition` are present) or
 * `clService.supplyLiquidity` (mint a new position).
 */
export type UseSupplyLiquidityVars<K extends SpokeChainKey = SpokeChainKey> = {
  params: UseCreateSupplyLiquidityParamsResult & { srcChainKey: K; srcAddress: string };
  walletProvider: GetWalletProviderType<K>;
  /** Optional relay timeout in ms (default 60_000) */
  timeout?: number;
};

type SupplyLiquidityResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for supplying liquidity to a concentrated-liquidity pool. If the input vars include a
 * valid `tokenId` for an existing position, the hook calls `increaseLiquidity`; otherwise it mints
 * a new position via `supplyLiquidity`. Pure mutation: returns the SDK `Result<T>` as-is; callers
 * branch on `data?.ok`.
 */
export function useSupplyLiquidity<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  SupplyLiquidityResult,
  Error,
  UseSupplyLiquidityVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<SupplyLiquidityResult, Error, UseSupplyLiquidityVars<K>>({
    mutationFn: async ({ params, walletProvider, timeout }) => {
      const sharedParams = {
        srcChainKey: params.srcChainKey,
        srcAddress: params.srcAddress as ClSupplyParams<K>['srcAddress'],
        poolKey: params.poolKey,
        tickLower: params.tickLower,
        tickUpper: params.tickUpper,
        liquidity: params.liquidity,
        amount0Max: params.amount0Max,
        amount1Max: params.amount1Max,
        sqrtPriceX96: params.sqrtPriceX96,
      } satisfies ClSupplyParams<K>;

      if (params.tokenId !== undefined && params.isValidPosition) {
        const increaseParams: ClIncreaseLiquidityParams<K> = {
          ...sharedParams,
          tokenId: typeof params.tokenId === 'bigint' ? params.tokenId : BigInt(params.tokenId),
        };
        return sodax.dex.clService.increaseLiquidity({ params: increaseParams, raw: false, walletProvider, timeout });
      }

      return sodax.dex.clService.supplyLiquidity({ params: sharedParams, raw: false, walletProvider, timeout });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['dex', 'positionInfo'] });
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolData', params.poolKey] });
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances', params.srcChainKey, params.srcAddress] });
      queryClient.invalidateQueries({ queryKey: ['xBalances', params.srcChainKey] });
    },
  });
}
