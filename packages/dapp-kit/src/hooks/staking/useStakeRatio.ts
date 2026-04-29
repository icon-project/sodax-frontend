import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseStakeRatioProps = {
  amount: bigint | undefined;
  queryOptions?: Omit<UseQueryOptions<[bigint, bigint], Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to estimate the SODA → xSODA stake ratio for a given amount. Hub-only read. Throws
 * on `!ok`.
 */
export function useStakeRatio({
  amount,
  queryOptions,
}: UseStakeRatioProps): UseQueryResult<[bigint, bigint], Error> {
  const { sodax } = useSodaxContext();

  return useQuery<[bigint, bigint], Error>({
    queryKey: ['staking', 'stakeRatio', amount?.toString()],
    queryFn: async () => {
      if (amount === undefined) {
        throw new Error('amount is required');
      }
      const result = await sodax.staking.getStakeRatio(amount);
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: amount !== undefined,
    refetchInterval: 10_000,
    ...queryOptions,
  });
}
