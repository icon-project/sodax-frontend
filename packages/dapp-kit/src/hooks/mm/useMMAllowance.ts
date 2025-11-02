import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { XToken } from '@sodax/types';
import { useSodaxContext } from '../shared/useSodaxContext';
import { parseUnits } from 'viem';
import type { MoneyMarketAction, SpokeProvider } from '@sodax/sdk';

/**
 * Hook for checking token allowance for money market operations.
 *
 * This hook verifies if the user has approved enough tokens for a specific money market action
 * (borrow/repay). It automatically queries and tracks the allowance status.
 *
 * @param {XToken} token - The token to check allowance for. Must be an XToken with valid address and chain information.
 * @param {string} amount - The amount to check allowance for, as a decimal string
 * @param {MoneyMarketAction} action - The money market action to check allowance for ('borrow' or 'repay')
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for allowance checks
 *
 * @returns {UseQueryResult<boolean, Error>} A React Query result containing:
 *   - data: Boolean indicating if allowance is sufficient
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during the check
 *
 * @example
 * ```typescript
 * const { data: hasAllowed, isLoading } = useMMAllowance(token, "100", "repay", provider);
 * ```
 */
export function useMMAllowance(
  token: XToken,
  amount: string,
  action: MoneyMarketAction,
  spokeProvider: SpokeProvider | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['allowance', token.address, amount, action],
    queryFn: async () => {
      if (!spokeProvider) throw new Error('Spoke provider is required');
      const actionBasedDecimals = action === 'withdraw' || action === 'borrow' ? 18 : token.decimals; // withdraw and borrow actions are in aToken decimals
      const allowance = await sodax.moneyMarket.isAllowanceValid(
        {
          token: token.address,
          amount: parseUnits(amount, actionBasedDecimals),
          action,
        },
        spokeProvider,
      );
      if (allowance.ok) {
        return allowance.value;
      }
      return false;
    },
    enabled: !!spokeProvider,
  });
}
