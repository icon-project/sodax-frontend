// packages/dapp-kit/src/hooks/backend/useAllMoneyMarketAssets.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { MoneyMarketAsset } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for fetching all money market assets from the backend API.
 *
 * This hook provides access to all available money market assets, including
 * their reserve information, liquidity rates, borrow rates, and market statistics.
 * The data is automatically fetched and cached using React Query.
 *
 * @returns {UseQueryResult<MoneyMarketAsset[]>} A query result object containing:
 *   - data: Array of money market asset data when available
 *   - isLoading: Boolean indicating if the request is in progress
 *   - error: Error object if the request failed
 *   - refetch: Function to manually trigger a data refresh
 *
 * @example
 * ```typescript
 * const { data: assets, isLoading, error } = useAllMoneyMarketAssets();
 *
 * if (isLoading) return <div>Loading assets...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (assets) {
 *   console.log('Total assets:', assets.length);
 *   assets.forEach(asset => {
 *     console.log(`${asset.symbol}: ${asset.liquidityRate} liquidity rate`);
 *   });
 * }
 * ```
 *
 * @remarks
 * - Uses React Query for efficient caching and state management
 * - Automatically handles error states and loading indicators
 * - Returns comprehensive asset information including rates and statistics
 * - No parameters required - fetches all available assets
 */
export const useBackendAllMoneyMarketAssets = (): UseQueryResult<MoneyMarketAsset[]> => {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['backend', 'moneymarket', 'assets', 'all'],
    queryFn: async (): Promise<MoneyMarketAsset[]> => {
      return sodax.backendApiService.getAllMoneyMarketAssets();
    },
    retry: 3,
  });
};
