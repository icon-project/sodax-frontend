// packages/dapp-kit/src/hooks/staking/useStakeAllowance.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { UnstakeParams, SpokeProvider } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/**
 * Hook for checking xSODA token allowance for unstaking operations.
 * Uses React Query for efficient caching and state management.
 *
 * @param {Omit<UnstakeParams, 'action'> | undefined} params - The unstaking parameters. If undefined, the query will be disabled.
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider to use for the allowance check
 * @returns {UseQueryResult<boolean, Error>} Query result object containing allowance data and state
 *
 * @example
 * ```typescript
 * const { data: hasAllowed, isLoading } = useUnstakeAllowance(
 *   {
 *     amount: 1000000000000000000n, // 1 xSODA
 *     account: '0x...'
 *   },
 *   spokeProvider
 * );
 *
 * if (isLoading) return <div>Checking allowance...</div>;
 * if (hasAllowed) {
 *   console.log('Sufficient allowance for unstaking');
 * }
 * ```
 */
export function useUnstakeAllowance(
  params: Omit<UnstakeParams, 'action'> | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['soda', 'unstakeAllowance', params, spokeProvider?.chainConfig.chain.id],
    queryFn: async () => {
      if (!params || !spokeProvider) {
        return false;
      }

      const result = await sodax.staking.isAllowanceValid({
        params: { ...params, action: 'unstake' },
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
