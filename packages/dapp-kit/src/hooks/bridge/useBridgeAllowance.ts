import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { SpokeProvider, CreateBridgeIntentParams } from '@sodax/sdk';

/**
 * Hook for checking token allowance for bridge operations.
 *
 * This hook verifies if the user has approved enough tokens for a specific bridge action.
 * It automatically queries and tracks the allowance status.
 *
 * @param {BridgeParams} params - The parameters for the bridge to check allowance for.
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for allowance checks
 *
 * @returns {UseQueryResult<boolean, Error>} A React Query result containing:
 *   - data: Boolean indicating if allowance is sufficient
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during the check
 *
 * @example
 * ```typescript
 * const { data: hasAllowed, isLoading } = useBridgeAllowance(params, spokeProvider);
 * ```
 */
export function useBridgeAllowance(
  params: CreateBridgeIntentParams | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['bridge-allowance', params],
    queryFn: async () => {
      if (!spokeProvider || !params) {
        return false;
      }

      const allowance = await sodax.bridge.isAllowanceValid({
        params,
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
