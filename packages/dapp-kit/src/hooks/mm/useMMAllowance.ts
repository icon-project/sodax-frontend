import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { MoneyMarketParams, SpokeProvider } from '@sodax/sdk';

/**
 * Hook for checking token allowance for money market operations.
 *
 * This hook verifies if the user has approved enough tokens for a specific money market action
 * (supply/borrow/withdraw/repay). It automatically queries and tracks the allowance status.
 *
 * @param {MoneyMarketParams} params - The money market parameters containing token address, amount, and action
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for allowance checks
 *
 * @returns {UseQueryResult<boolean, Error>} A React Query result containing:
 *   - data: Boolean indicating if allowance is sufficient
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during the check
 *
 * @example
 * ```typescript
 * const { data: hasAllowed, isLoading } = useMMAllowance(
 *   {
 *     token: token.address,
 *     amount: parseUnits("100", token.decimals),
 *     action: "repay",
 *   },
 *   spokeProvider
 * );
 * ```
 */
export function useMMAllowance(
  params: MoneyMarketParams | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['allowance', params],
    queryFn: async () => {
      if (!spokeProvider || !params) {
        return false;
      }
      const allowance = await sodax.moneyMarket.isAllowanceValid(params, spokeProvider);
      if (!allowance.ok) {
        throw allowance.error;
      }
      return allowance.value;
    },
    enabled: !!spokeProvider && !!params,
  });
}
