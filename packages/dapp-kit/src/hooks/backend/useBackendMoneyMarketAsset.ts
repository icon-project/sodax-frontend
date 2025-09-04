// packages/dapp-kit/src/hooks/backend/useMoneyMarketAsset.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { MoneyMarketAsset } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for fetching specific money market asset details from the backend API.
 *
 * This hook provides access to detailed information for a specific money market asset,
 * including reserve information, liquidity rates, borrow rates, and market statistics.
 * The data is automatically fetched and cached using React Query.
 *
 * @param {string | undefined} reserveAddress - The reserve contract address. If undefined, the query will be disabled.
 *
 * @returns {UseQueryResult<MoneyMarketAsset | undefined>} A query result object containing:
 *   - data: The money market asset data when available
 *   - isLoading: Boolean indicating if the request is in progress
 *   - error: Error object if the request failed
 *   - refetch: Function to manually trigger a data refresh
 *
 * @example
 * ```typescript
 * const { data: asset, isLoading, error } = useMoneyMarketAsset('0xabc...');
 *
 * if (isLoading) return <div>Loading asset...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (asset) {
 *   console.log('Asset symbol:', asset.symbol);
 *   console.log('Liquidity rate:', asset.liquidityRate);
 *   console.log('Variable borrow rate:', asset.variableBorrowRate);
 * }
 * ```
 *
 * @remarks
 * - The query is disabled when reserveAddress is undefined or empty
 * - Uses React Query for efficient caching and state management
 * - Automatically handles error states and loading indicators
 * - Returns comprehensive asset information for the specified reserve
 */
export const useBackendMoneyMarketAsset = (
  reserveAddress: string | undefined,
): UseQueryResult<MoneyMarketAsset | undefined> => {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['backend', 'moneymarket', 'asset', reserveAddress],
    queryFn: async (): Promise<MoneyMarketAsset | undefined> => {
      if (!reserveAddress) {
        return undefined;
      }

      return sodax.backendApiService.getMoneyMarketAsset(reserveAddress);
    },
    enabled: !!reserveAddress && reserveAddress.length > 0,
    retry: 3,
  });
};
