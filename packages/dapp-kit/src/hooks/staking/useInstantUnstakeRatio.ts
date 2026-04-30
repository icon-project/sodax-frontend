import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseInstantUnstakeRatioProps = {
  amount: bigint | undefined;
  queryOptions?: Omit<UseQueryOptions<bigint, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to estimate the SODA amount received from instant-unstaking a given xSODA amount
 * (after slippage). Hub-only read. Throws on `!ok`.
 */
export function useInstantUnstakeRatio({
  amount,
  queryOptions,
}: UseInstantUnstakeRatioProps): UseQueryResult<bigint, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<bigint, Error>({
    queryKey: ['staking', 'instantUnstakeRatio', amount?.toString()],
    queryFn: async () => {
      if (amount === undefined) {
        throw new Error('amount is required');
      }
      const result = await sodax.staking.getInstantUnstakeRatio(amount);
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: amount !== undefined,
    refetchInterval: 10_000,
    ...queryOptions,
  });
}
