// packages/dapp-kit/src/hooks/backend/useMoneyMarketPosition.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { MoneyMarketPosition } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for fetching money market position for a specific user from the backend API.
 *
 * This hook provides access to a user's money market positions, including their
 * aToken balances, variable debt token balances, and associated reserve information.
 * The data is automatically fetched and cached using React Query.
 *
 * @param {string | undefined} userAddress - The user's wallet address. If undefined, the query will be disabled.
 *
 * @returns {UseQueryResult<MoneyMarketPosition | undefined>} A query result object containing:
 *   - data: The money market position data when available
 *   - isLoading: Boolean indicating if the request is in progress
 *   - error: Error object if the request failed
 *   - refetch: Function to manually trigger a data refresh
 *
 * @example
 * ```typescript
 * const { data: position, isLoading, error } = useMoneyMarketPosition('0x123...');
 *
 * if (isLoading) return <div>Loading position...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (position) {
 *   console.log('User address:', position.userAddress);
 *   console.log('Positions:', position.positions);
 * }
 * ```
 *
 * @remarks
 * - The query is disabled when userAddress is undefined or empty
 * - Uses React Query for efficient caching and state management
 * - Automatically handles error states and loading indicators
 * - Includes user's aToken and debt token balances across all reserves
 */
export const useBackendMoneyMarketPosition = (
  userAddress: string | undefined,
): UseQueryResult<MoneyMarketPosition | undefined> => {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['backend', 'moneymarket', 'position', userAddress],
    queryFn: async (): Promise<MoneyMarketPosition | undefined> => {
      if (!userAddress) {
        return undefined;
      }

      return sodax.backendApi.getMoneyMarketPosition(userAddress);
    },
    enabled: !!userAddress && userAddress.length > 0,
    retry: 3,
  });
};
