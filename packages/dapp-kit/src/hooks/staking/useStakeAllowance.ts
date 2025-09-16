// packages/dapp-kit/src/hooks/staking/useStakeAllowance.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { StakeParams, StakingError, StakingErrorCode } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { SpokeProvider } from '@sodax/sdk';

/**
 * Hook for checking SODA token allowance for staking operations.
 * Uses React Query for efficient caching and state management.
 *
 * @param {StakeParams | undefined} params - The staking parameters. If undefined, the query will be disabled.
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for the allowance check
 * @returns {UseQueryResult} Query result object containing allowance data and state
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
  params: StakeParams | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['stakeAllowance', params, spokeProvider?.chainConfig.chain.id],
    queryFn: async () => {
      if (!params || !spokeProvider) {
        return false;
      }

      const result = await sodax.staking.isAllowanceValid({
        params,
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


