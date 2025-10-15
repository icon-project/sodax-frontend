// packages/dapp-kit/src/hooks/staking/useInstantUnstakeRatio.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/**
 * Hook for fetching instant unstake ratio estimates.
 * Uses React Query for efficient caching and state management.
 *
 * @param {bigint | undefined} amount - The amount of xSoda to estimate instant unstake for
 * @param {number} refetchInterval - The interval in milliseconds to refetch data (default: 10000)
 * @returns {UseQueryResult<bigint, Error>} Query result object containing instant unstake ratio and state
 *
 * @example
 * ```typescript
 * const { data: instantUnstakeRatio, isLoading, error } = useInstantUnstakeRatio(1000000000000000000n); // 1 xSoda
 *
 * if (isLoading) return <div>Loading instant unstake ratio...</div>;
 * if (instantUnstakeRatio) {
 *   console.log('Instant unstake ratio:', instantUnstakeRatio);
 * }
 * ```
 */
export function useInstantUnstakeRatio(
  amount: bigint | undefined,
  refetchInterval = 10000,
): UseQueryResult<bigint, Error> {
  const { sodax } = useSodaxContext();

  console.log('useInstantUnstakeRatio hook called with:', { amount: amount?.toString(), sodax: !!sodax });

  return useQuery({
    queryKey: ['soda', 'instantUnstakeRatio', amount?.toString()],
    queryFn: async () => {
      console.log('useInstantUnstakeRatio queryFn called with amount:', amount?.toString());
      if (!amount || amount <= 0n) {
        throw new Error('Amount must be greater than 0');
      }

      if (!sodax?.staking) {
        throw new Error('Staking service not available');
      }

      const result = await sodax.staking.getInstantUnstakeRatio(amount);

      if (!result.ok) {
        throw new Error(`Failed to fetch instant unstake ratio: ${result.error.code}`);
      }

      return result.value;
    },
    enabled: !!amount && amount > 0n && !!sodax?.staking,
    refetchInterval,
  });
}
