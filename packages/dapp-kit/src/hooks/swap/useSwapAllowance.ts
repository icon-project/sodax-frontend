import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { CreateIntentParams, SpokeProvider } from '@sodax/sdk';

/**
 * Hook for checking token allowance for money market operations.
 *
 * This hook verifies if the user has approved enough tokens for a specific money market action
 * (borrow/repay). It automatically queries and tracks the allowance status.
 *
 * @param {CreateIntentParams} params - The parameters for the intent to check allowance for.
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for allowance checks
 *
 * @returns {UseQueryResult<boolean, Error>} A React Query result containing:
 *   - data: Boolean indicating if allowance is sufficient
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during the check
 *
 * @example
 * ```typescript
 * const { data: hasAllowed, isLoading } = useMMAllowance(params, spokeProvider);
 * ```
 */
export function useSwapAllowance(
  params: CreateIntentParams | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['allowance', params],
    queryFn: async () => {
      if (!spokeProvider || !params) {
        return false;
      }
      const allowance = await sodax.solver.isAllowanceValid({
        intentParams: params,
        spokeProvider,
      });
      if (allowance.ok) {
        return allowance.value;
      }
      return false;
    },
    enabled: !!spokeProvider && !!params,
  });
}
