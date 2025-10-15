// packages/dapp-kit/src/hooks/staking/useStakeRatio.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/**
 * Hook for fetching stake ratio estimates (xSoda amount and preview deposit).
 * Uses React Query for efficient caching and state management.
 *
 * @param {bigint | undefined} amount - The amount of SODA to estimate stake for
 * @param {number} refetchInterval - The interval in milliseconds to refetch data (default: 10000)
 * @returns {UseQueryResult<[bigint, bigint], Error>} Query result object containing stake ratio estimates and state
 *
 * @example
 * ```typescript
 * const { data: stakeRatio, isLoading, error } = useStakeRatio(1000000000000000000n); // 1 SODA
 *
 * if (isLoading) return <div>Loading stake ratio...</div>;
 * if (stakeRatio) {
 *   const [xSodaAmount, previewDepositAmount] = stakeRatio;
 *   console.log('xSoda amount:', xSodaAmount);
 *   console.log('Preview deposit:', previewDepositAmount);
 * }
 * ```
 */
export function useStakeRatio(
  amount: bigint | undefined,
  refetchInterval = 10000,
): UseQueryResult<[bigint, bigint], Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['soda', 'stakeRatio', amount?.toString()],
    queryFn: async () => {
      if (!amount || amount <= 0n) {
        throw new Error('Amount must be greater than 0');
      }

      if (!sodax?.staking) {
        throw new Error('Staking service not available');
      }

      const result = await sodax.staking.getStakeRatio(amount);

      if (!result.ok) {
        throw new Error(`Failed to fetch stake ratio: ${result.error.code}`);
      }

      return result.value;
    },
    enabled: !!amount && amount > 0n && !!sodax?.staking,
    refetchInterval,
  });
}
