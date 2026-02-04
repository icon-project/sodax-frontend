// apps/web/app/(apps)/stake/_components/stake-dialog/useStakeAllowanceNextjs.ts
import { useSodaxContext } from '@sodax/dapp-kit';
import type { StakeParams, SpokeProvider } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/**
 * Custom hook for checking SODA token allowance for staking operations in Next.js.
 * This version handles BigInt serialization by converting BigInt values to strings in the query key.
 *
 * @param {Omit<StakeParams, 'action'> | undefined} params - The staking parameters. If undefined, the query will be disabled.
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider to use for the allowance check
 * @returns {UseQueryResult<boolean, Error>} Query result object containing allowance data and state
 */
export function useStakeAllowanceNextjs(
  params: Omit<StakeParams, 'action'> | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  const serializedParams = params
    ? {
        amount: params.amount.toString(),
        account: params.account,
        minReceive: params.minReceive.toString(),
      }
    : undefined;

  return useQuery({
    queryKey: ['soda', 'stakeAllowance', serializedParams, spokeProvider?.chainConfig.chain.id],
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
