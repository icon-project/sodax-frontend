import type { UnstakeRequestWithPenalty, UnstakingInfo } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UnstakingInfoWithPenalty = UnstakingInfo & { requestsWithPenalty: UnstakeRequestWithPenalty[] };

export type UseUnstakingInfoWithPenaltyProps = {
  srcAddress: `0x${string}` | undefined;
  srcChainKey: SpokeChainKey | undefined;
  queryOptions?: Omit<UseQueryOptions<UnstakingInfoWithPenalty, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to fetch the user's pending unstake requests **with computed early-exit penalties**
 * by deriving the hub wallet from the spoke `srcAddress` + `srcChainKey`. Throws on `!ok`.
 */
export function useUnstakingInfoWithPenalty({
  srcAddress,
  srcChainKey,
  queryOptions,
}: UseUnstakingInfoWithPenaltyProps): UseQueryResult<UnstakingInfoWithPenalty, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<UnstakingInfoWithPenalty, Error>({
    queryKey: ['staking', 'unstakingInfoWithPenalty', srcChainKey, srcAddress],
    queryFn: async () => {
      if (!srcAddress || !srcChainKey) {
        throw new Error('srcAddress and srcChainKey are required');
      }
      const result = await sodax.staking.getUnstakingInfoWithPenalty(srcAddress, srcChainKey);
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: !!srcAddress && !!srcChainKey,
    refetchInterval: 5_000,
    ...queryOptions,
  });
}
