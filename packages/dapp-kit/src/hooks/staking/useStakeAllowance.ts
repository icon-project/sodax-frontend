// packages/dapp-kit/src/hooks/staking/useStakeAllowance.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { StakeParams, SpokeProvider } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/**
 * Hook for checking SODA token allowance for staking operations.
 * Uses React Query for efficient caching and state management.
 *
 * @param {Omit<StakeParams, 'action'> | undefined} params - The staking parameters. If undefined, the query will be disabled.
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider to use for the allowance check
 * @returns {UseQueryResult<boolean, Error>} Query result object containing allowance data and state
 *
 * @example
 * ```typescript
 * const { data: hasAllowed, isLoading } = useStakeAllowance(
 *   {
 *     amount: 1000000000000000000n, // 1 SODA
 *     account: '0x...'
 *   },
 *   spokeProvider
 * );
 *
 * if (isLoading) return <div>Checking allowance...</div>;
 * if (hasAllowed) {
 *   console.log('Sufficient allowance for staking');
 * }
 * ```
 */
export function useStakeAllowance(
  params: Omit<StakeParams, 'action'> | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['soda', 'stakeAllowance', params, spokeProvider?.chainConfig.chain.id],
    queryFn: async () => {
      if (!params || !spokeProvider) {
        return false;
      }

      const result = await sodax.staking.isAllowanceValid({
        params: { ...params, action: 'stake' },
        spokeProvider,
      });

      if (!result.ok) {
        throw new Error(`Allowance check failed: ${result.error.code}`);
      }

      return result.value;
    },
    enabled: !!params && !!spokeProvider,
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}
