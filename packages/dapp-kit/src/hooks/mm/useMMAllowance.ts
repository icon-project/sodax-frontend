import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { MoneyMarketParams, SpokeProvider } from '@sodax/sdk';

export type UseMMAllowanceParams = {
  params: MoneyMarketParams | undefined;
  spokeProvider: SpokeProvider | undefined;
  queryOptions?: UseQueryOptions<boolean, Error>;
};

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
export function useMMAllowance({
  params,
  spokeProvider,
  queryOptions,
}: UseMMAllowanceParams): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  const defaultQueryOptions = {
    queryKey: ['mm', 'allowance', params?.token, params?.action],
    enabled: !!spokeProvider,
    refetchInterval: 5000,
  };

  queryOptions = {
    ...defaultQueryOptions,
    ...queryOptions, // override default query options if provided
  }

  return useQuery({
    ...queryOptions,
    queryFn: async () => {
      if (!spokeProvider) throw new Error('Spoke provider is required');
      if (!params) throw new Error('Params are required');

      const allowance = await sodax.moneyMarket.isAllowanceValid(params, spokeProvider);

      if (!allowance.ok) {
        throw allowance.error;
      }

      return allowance.value;
    },
  });
}
