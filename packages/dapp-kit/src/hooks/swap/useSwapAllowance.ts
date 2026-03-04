import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { CreateIntentParams, CreateLimitOrderParams, SpokeProvider } from '@sodax/sdk';

/**
 * Hook for checking token allowance for swap operations.
 *
 * This hook verifies if the user has approved enough tokens for a specific swap action.
 * It automatically queries and tracks the allowance status.
 *
 * @param {CreateIntentParams | CreateLimitOrderParams} params - The parameters for the intent to check allowance for.
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for allowance checks
 *
 * @returns {UseQueryResult<boolean, Error>} A React Query result containing:
 *   - data: Boolean indicating if allowance is sufficient
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during the check
 *
 * @example
 * ```typescript
 * const { data: hasAllowed, isLoading } = useSwapAllowance(params, spokeProvider);
 * ```
 */
export function useSwapAllowance(
  params: CreateIntentParams | CreateLimitOrderParams | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['allowance', params],
    queryFn: async () => {
      if (!spokeProvider || !params) {
        return false;
      }
      const allowance = await sodax.swaps.isAllowanceValid({
        intentParams: params,
        spokeProvider,
      });
      if (allowance.ok) {
        return allowance.value;
      }
      return false;
    },
    enabled: !!spokeProvider && !!params,
    refetchInterval: 2000,
  });
}
