import type { StakingInfo } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseStakingInfoProps = {
  srcAddress: `0x${string}` | undefined;
  srcChainKey: SpokeChainKey | undefined;
  queryOptions?: Omit<UseQueryOptions<StakingInfo, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to fetch the user's staking info (xSODA balance, share value, underlying SODA) by
 * deriving the hub wallet from the spoke `srcAddress` + `srcChainKey`. Throws on `!ok` so React
 * Query lands in `error` state.
 */
export function useStakingInfo({
  srcAddress,
  srcChainKey,
  queryOptions,
}: UseStakingInfoProps): UseQueryResult<StakingInfo, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<StakingInfo, Error>({
    queryKey: ['staking', 'info', srcChainKey, srcAddress],
    queryFn: async () => {
      if (!srcAddress || !srcChainKey) {
        throw new Error('srcAddress and srcChainKey are required');
      }
      const result = await sodax.staking.getStakingInfoFromSpoke(srcAddress, srcChainKey);
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: !!srcAddress && !!srcChainKey,
    refetchInterval: 5_000,
    ...queryOptions,
  });
}
