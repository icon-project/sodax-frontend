// packages/dapp-kit/src/hooks/staking/useConvertedAssets.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/**
 * Hook for fetching converted assets amount for xSODA shares.
 * Uses React Query for efficient caching and state management.
 *
 * @param {bigint | undefined} amount - The amount of xSODA shares to convert
 * @param {number} refetchInterval - The interval in milliseconds to refetch data (default: 10000)
 * @returns {UseQueryResult<bigint, Error>} Query result object containing converted assets amount and state
 *
 * @example
 * ```typescript
 * const { data: convertedAssets, isLoading, error } = useConvertedAssets(1000000000000000000n); // 1 xSODA
 *
 * if (isLoading) return <div>Loading converted assets...</div>;
 * if (convertedAssets) {
 *   console.log('Converted assets:', convertedAssets);
 * }
 * ```
 */
export function useConvertedAssets(amount: bigint | undefined, refetchInterval = 10000): UseQueryResult<bigint, Error> {
  const { sodax } = useSodaxContext();

  console.log('useConvertedAssets hook called with:', { amount: amount?.toString(), sodax: !!sodax });

  return useQuery({
    queryKey: ['soda', 'convertedAssets', amount?.toString()],
    queryFn: async () => {
      console.log('useConvertedAssets queryFn called with amount:', amount?.toString());
      if (!amount || amount <= 0n) {
        throw new Error('Amount must be greater than 0');
      }

      const result = await sodax.staking.getConvertedAssets(amount);

      if (!result.ok) {
        throw new Error(`Failed to fetch converted assets: ${result.error.code}`);
      }

      return result.value;
    },
    enabled: !!amount && amount > 0n && !!sodax?.staking,
    refetchInterval,
  });
}
