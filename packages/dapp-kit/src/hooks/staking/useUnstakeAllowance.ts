import type { UnstakeParams } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseUnstakeAllowanceProps<K extends SpokeChainKey = SpokeChainKey> = {
  params: Omit<UnstakeParams<K>, 'action'> | undefined;
  queryOptions?: Omit<UseQueryOptions<boolean, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to check whether the user has approved sufficient xSODA spending for the unstake
 * action. Read-only — calls `staking.isAllowanceValid` with `raw: true` so no `walletProvider`
 * is required.
 */
export function useUnstakeAllowance<K extends SpokeChainKey = SpokeChainKey>({
  params,
  queryOptions,
}: UseUnstakeAllowanceProps<K>): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<boolean, Error>({
    queryKey: ['staking', 'allowance', params?.srcChainKey, 'unstake', params?.srcAddress, params?.amount?.toString()],
    queryFn: async () => {
      if (!params) {
        throw new Error('Params are required');
      }
      const result = await sodax.staking.isAllowanceValid({
        params: { ...params, action: 'unstake' },
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
