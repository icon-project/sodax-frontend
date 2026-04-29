import type { CreateAssetDepositParams } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseDexAllowanceProps<K extends SpokeChainKey = SpokeChainKey> = {
  params: CreateAssetDepositParams<K> | undefined;
  queryOptions?: Omit<UseQueryOptions<boolean, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to check whether the user has approved sufficient token allowance (or established a
 * trustline, on Stellar) for a DEX deposit. Read-only — calls `assetService.isAllowanceValid`
 * with `raw: true` so no `walletProvider` is required.
 */
export function useDexAllowance<K extends SpokeChainKey = SpokeChainKey>({
  params,
  queryOptions,
}: UseDexAllowanceProps<K>): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<boolean, Error>({
    queryKey: ['dex', 'allowance', params?.srcChainKey, params?.asset, params?.amount?.toString()],
    queryFn: async () => {
      if (!params) {
        throw new Error('Params are required');
      }
      const result = await sodax.dex.assetService.isAllowanceValid({ params, raw: true });
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: !!params,
    refetchInterval: 5_000,
    gcTime: 0,
    ...queryOptions,
  });
}
