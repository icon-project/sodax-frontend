import type { Hex, SolverErrorResponse, SolverIntentStatusResponse, Result } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for monitoring the status of an intent-based swap.
 *
 * This hook provides real-time status updates for an intent-based swap transaction.
 *
 * @param {Hex} intent_tx_hash - The transaction hash of the intent order on the hub chain
 *
 * @returns {UseQueryResult<Result<SolverIntentStatusResponse, SolverErrorResponse> | undefined>} A query result object containing:
 *   - data: The status result from the solver
 *   - isLoading: Boolean indicating if the status is being fetched
 *   - error: Error object if the status request failed
 *   - refetch: Function to manually trigger a status refresh
 *
 * @example
 * ```typescript
 * const { data: status, isLoading } = useStatus('0x...');
 *
 * if (isLoading) return <div>Loading status...</div>;
 * if (status?.ok) {
 *   console.log('Status:', status.value);
 * }
 * ```
 *
 * @remarks
 * - The status is automatically refreshed every 3 seconds
 * - Uses React Query for efficient caching and state management
 */

export const useStatus = (
  intent_tx_hash: Hex,
): UseQueryResult<Result<SolverIntentStatusResponse, SolverErrorResponse> | undefined> => {
  const { sodax } = useSodaxContext();
  return useQuery({
    queryKey: [intent_tx_hash],
    queryFn: async () => {
      return sodax.swaps.getStatus({ intent_tx_hash });
    },
    refetchInterval: 3000, // 3s
  });
};
