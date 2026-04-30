import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseConvertedAssetsProps = {
  amount: bigint | undefined;
  queryOptions?: Omit<UseQueryOptions<bigint, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to convert an xSODA share amount to its underlying SODA value via the vault's
 * exchange rate. Hub-only read. Throws on `!ok`.
 */
export function useConvertedAssets({
  amount,
  queryOptions,
}: UseConvertedAssetsProps): UseQueryResult<bigint, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<bigint, Error>({
    queryKey: ['staking', 'convertedAssets', amount?.toString()],
    queryFn: async () => {
      if (amount === undefined) {
        throw new Error('amount is required');
      }
      const result = await sodax.staking.getConvertedAssets(amount);
      if (!result.ok) throw result.error;
      return result.value;
    },
    enabled: amount !== undefined,
    refetchInterval: 10_000,
    ...queryOptions,
  });
}
