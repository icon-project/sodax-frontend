import { type QueryObserverOptions, useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { SpokeProvider, CreateAssetDepositParams } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseDexAllowanceProps = {
  params: CreateAssetDepositParams | undefined;
  spokeProvider: SpokeProvider | null;
  enabled?: boolean;
  queryOptions?: QueryObserverOptions<boolean, Error>;
};

/**
 * Hook to check if the user has approved sufficient token allowance for DEX deposits.
 *
 * This hook automatically queries and tracks the allowance status, indicating whether
 * the user has granted enough allowance to allow a specific deposit to the DEX. It leverages
 * React Query for status, caching, and background refetching.
 *
 * @param {CreateAssetDepositParams | undefined} params
 *   The deposit parameters: asset address, poolToken, and raw amount (BigInt), or undefined to disable.
 * @param {SpokeProvider | undefined} spokeProvider
 *   The provider interface for the selected chain. When undefined, the query is disabled.
 * @param {boolean} [enabled]
 *   Whether the allowance status check is enabled. Defaults to true if both params and spokeProvider are truthy.
 * @param {QueryObserverOptions<boolean, Error>} [queryOptions]
 *   Optional react-query options. Any override here (e.g. staleTime, refetchInterval) will merge with defaults.
 *
 * @returns {UseQueryResult<boolean, Error>}
 *   React Query result object: `data` is boolean (true if allowance is sufficient), plus `isLoading`, `error`, etc.
 *
 * @example
 * ```typescript
 * const { data: isAllowed, isLoading, error } = useDexAllowance({
 *   params: { asset, amount: parseUnits('100', 18), poolToken },
 *   spokeProvider,
 * });
 * if (isLoading) return <Spinner />;
 * if (error) return <div>Error: {error.message}</div>;
 * if (isAllowed) { ... }
 * ```
 *
 * @remarks
 * - The allowance is checked every 5 seconds as long as enabled, params, and spokeProvider are all defined.
 * - Returns `false` if allowance cannot be determined or any error occurs in isAllowanceValid.
 * - Suitable for gating UI actions that require token approval before depositing in the DEX.
 */
export function useDexAllowance({
  params,
  spokeProvider,
  queryOptions = {
    queryKey: [
      'dex',
      'allowance',
      params?.asset,
      params?.poolToken,
      params?.amount.toString(),
      spokeProvider?.chainConfig.chain.id,
    ],
    enabled: !!params && !!spokeProvider,
  },
}: UseDexAllowanceProps): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    ...queryOptions,
    queryFn: async () => {
      if (!params || !spokeProvider) {
        throw new Error('Params and spoke provider are required');
      }

      const allowanceResult = await sodax.dex.assetService.isAllowanceValid({
        params: {
          asset: params.asset,
          amount: params.amount,
          poolToken: params.poolToken,
        },
        spokeProvider,
      });

      if (!allowanceResult.ok) {
        return false;
      }

      return allowanceResult.value;
    },
  });
}
