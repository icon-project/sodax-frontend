import type { StakeParams } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseStakeAllowanceProps<K extends SpokeChainKey = SpokeChainKey> = {
  params: Omit<StakeParams<K>, 'action'> | undefined;
  queryOptions?: Omit<UseQueryOptions<boolean, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to check whether the user has approved sufficient SODA spending for the stake
 * action. Read-only — calls `staking.isAllowanceValid` with `raw: true` so no `walletProvider`
 * is required.
 */
export function useStakeAllowance<K extends SpokeChainKey = SpokeChainKey>({
  params,
  queryOptions,
}: UseStakeAllowanceProps<K>): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<boolean, Error>({
    queryKey: ['staking', 'allowance', params?.srcChainKey, 'stake', params?.srcAddress, params?.amount?.toString()],
    queryFn: async () => {
      if (!params) {
        throw new Error('Params are required');
      }
      const result = await sodax.staking.isAllowanceValid({
        params: { ...params, action: 'stake' },
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
