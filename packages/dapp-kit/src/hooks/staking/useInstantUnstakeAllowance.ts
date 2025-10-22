// packages/dapp-kit/src/hooks/staking/useStakeAllowance.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { SpokeProvider, InstantUnstakeParams } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/**
 * Hook for checking xSODA token allowance for instant unstaking operations.
 * Uses React Query for efficient caching and state management.
 *
 * @param {Omit<InstantUnstakeParams, 'action'> | undefined} params - The instant unstaking parameters. If undefined, the query will be disabled.
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider to use for the allowance check
 * @returns {UseQueryResult<boolean, Error>} Query result object containing allowance data and state
 *
 * @example
 * ```typescript
 * const { data: hasAllowed, isLoading } = useInstantUnstakeAllowance(
 *   {
 *     amount: 1000000000000000000n, // 1 xSODA
 *     minAmount: 950000000000000000n, // 0.95 SODA
 *     account: '0x...'
 *   },
 *   spokeProvider
 * );
 *
 * if (isLoading) return <div>Checking allowance...</div>;
 * if (hasAllowed) {
 *   console.log('Sufficient allowance for instant unstaking');
 * }
 * ```
 */
export function useInstantUnstakeAllowance(
  params: Omit<InstantUnstakeParams, 'action'> | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['soda', 'instantUnstakeAllowance', params, spokeProvider?.chainConfig.chain.id],
    queryFn: async () => {
      if (!params || !spokeProvider) {
        return false;
      }

      const result = await sodax.staking.isAllowanceValid({
        params: { ...params, action: 'instantUnstake' },
        spokeProvider,
      });

      if (!result.ok) {
        console.error(`Unstake allowance check failed: ${result.error.code}, error: ${result.error.error}`);
        throw new Error(`Unstake allowance check failed: ${result.error.code}`);
      }

      return result.value;
    },
    enabled: !!params && !!spokeProvider,
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}
