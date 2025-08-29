// apps/web/app/(apps)/swap/_hooks/useSwapAllowance.tsx
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '@sodax/dapp-kit';
import type { CreateIntentParams, SpokeProvider } from '@sodax/sdk';

/**
 * Manual hook for checking token allowance for swap operations.
 *
 * This hook verifies if the user has approved enough tokens for a specific swap action.
 * It provides manual refetch functionality and follows the same interface as the dapp-kit version.
 * Uses the same query key as the dapp-kit version for compatibility with approval flows.
 *
 * @param {CreateIntentParams} params - The parameters for the intent to check allowance for.
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for allowance checks
 *
 * @returns {UseQueryResult<boolean, Error>} A React Query result containing:
 *   - data: Boolean indicating if allowance is sufficient
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during the check
 *   - refetch: Function to manually refetch the allowance
 *
 * @example
 * ```typescript
 * const { data: hasAllowed, isLoading, refetch } = useSwapAllowance(params, spokeProvider);
 *
 * // Manual refetch when needed
 * await refetch();
 *
 * // Or refetch after approval
 * await refetch();
 * ```
 */
export function useSwapAllowance(
  params: CreateIntentParams | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseQueryResult<boolean, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['allowance', params],
    queryFn: async (): Promise<boolean> => {
      if (!spokeProvider || !params) {
        return false;
      }

      try {
        const allowance = await sodax.solver.isAllowanceValid({
          intentParams: params,
          spokeProvider,
        });

        if (allowance.ok) {
          return allowance.value;
        }

        return false;
      } catch (error) {
        console.error('Error checking swap allowance:', error);
        return false;
      }
    },
    enabled: !!spokeProvider && !!params,
    refetchInterval: 2000,
  });
}
