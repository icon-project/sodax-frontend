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
    /**
     * IMPORTANT: Skip allowance checks for 'borrow' and 'withdraw' actions.
     *
     * Reason: According to the SDK's MoneyMarketService.isAllowanceValid() implementation,
     * borrow and withdraw actions do NOT require ERC-20 token approval. The SDK's
     * isAllowanceValid() method always returns `true` for these actions without making
     * any on-chain allowance checks.
     *
     * This optimization prevents unnecessary RPC calls and avoids showing confusing states for actions that don't actually need approval.
     *
     * Only 'supply' and 'repay' actions require token approval and should trigger allowance checks.
     */
    enabled: !!spokeProvider && !!params && params.action !== 'borrow' && params.action !== 'withdraw',
    refetchInterval: 5000,
    gcTime: 0, // Don't cache failed queries
  };

  queryOptions = {
    ...defaultQueryOptions,
    ...queryOptions, // override default query options if provided
  };

  return useQuery({
    ...queryOptions,
    queryFn: async () => {
      if (!spokeProvider) throw new Error('Spoke provider is required');
      if (!params) throw new Error('Params are required');

      /**
       * Early return for borrow/withdraw actions: these actions do NOT require ERC-20 token approval.
       *
       * The SDK's MoneyMarketService.isAllowanceValid() always returns `true` for borrow/withdraw
       * without checking on-chain allowance. This is because:
       * - Borrow: User receives tokens (no approval needed)
       * - Withdraw: User withdraws their own supplied tokens (no approval needed)
       *
       * By returning `true` here, we avoid unnecessary RPC calls and ensure consistent behavior
       * with the SDK's implementation.
       */
      if (params.action === 'borrow' || params.action === 'withdraw') {
        return true;
      }

      const allowance = await sodax.moneyMarket.isAllowanceValid(params, spokeProvider);

      if (!allowance.ok) {
        throw allowance.error;
      }

      return allowance.value;
    },
  });
}
