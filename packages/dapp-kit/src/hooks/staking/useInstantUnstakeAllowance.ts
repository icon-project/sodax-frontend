import type { InstantUnstakeParams } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseInstantUnstakeAllowanceProps<K extends SpokeChainKey = SpokeChainKey> = {
  params: Omit<InstantUnstakeParams<K>, 'action'> | undefined;
  queryOptions?: Omit<UseQueryOptions<boolean, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to check whether the user has approved sufficient xSODA spending for the
 * instant-unstake action. Read-only — calls `staking.isAllowanceValid` with `raw: true` so no
 * `walletProvider` is required.
 */
export function useInstantUnstakeAllowance<K extends SpokeChainKey = SpokeChainKey>({
  params,
  queryOptions,
}: UseInstantUnstakeAllowanceProps<K>): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<boolean, Error>({
    queryKey: [
      'staking',
      'allowance',
      params?.srcChainKey,
      'instantUnstake',
      params?.srcAddress,
      params?.amount?.toString(),
    ],
    queryFn: async () => {
      if (!params) {
        throw new Error('Params are required');
      }
      const result = await sodax.staking.isAllowanceValid({
        params: { ...params, action: 'instantUnstake' },
        raw: true,
      });
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: !!params,
    refetchInterval: 5_000,
    gcTime: 0,
    ...queryOptions,
  });
}
