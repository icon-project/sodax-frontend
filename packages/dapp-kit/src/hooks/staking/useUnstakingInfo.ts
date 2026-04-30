import type { UnstakingInfo } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseUnstakingInfoProps = {
  srcAddress: `0x${string}` | undefined;
  srcChainKey: SpokeChainKey | undefined;
  queryOptions?: Omit<UseQueryOptions<UnstakingInfo, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to fetch the user's pending unstake requests by deriving the hub wallet from the
 * spoke `srcAddress` + `srcChainKey`. Throws on `!ok`.
 */
export function useUnstakingInfo({
  srcAddress,
  srcChainKey,
  queryOptions,
}: UseUnstakingInfoProps): UseQueryResult<UnstakingInfo, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<UnstakingInfo, Error>({
    queryKey: ['staking', 'unstakingInfo', srcChainKey, srcAddress],
    queryFn: async () => {
      if (!srcAddress || !srcChainKey) {
        throw new Error('srcAddress and srcChainKey are required');
      }
      const result = await sodax.staking.getUnstakingInfo(srcAddress, srcChainKey);
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: !!srcAddress && !!srcChainKey,
    refetchInterval: 5_000,
    ...queryOptions,
  });
}
