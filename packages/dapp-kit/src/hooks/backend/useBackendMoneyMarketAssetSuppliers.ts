// packages/dapp-kit/src/hooks/backend/useMoneyMarketAssetSuppliers.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { MoneyMarketAssetSuppliers } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for fetching suppliers for a specific money market asset from the backend API.
 *
 * This hook provides access to the list of suppliers for a specific money market asset,
 * with pagination support. The data is automatically fetched and cached using React Query.
 *
 * @param {Object} params - Parameters for fetching asset suppliers
 * @param {string | undefined} params.reserveAddress - The reserve contract address. If undefined, the query will be disabled.
 * @param {string} params.offset - The offset for pagination (number as string)
 * @param {string} params.limit - The limit for pagination (number as string)
 *
 * @returns {UseQueryResult<MoneyMarketAssetSuppliers | undefined>} A query result object containing:
 *   - data: The asset suppliers data when available
 *   - isLoading: Boolean indicating if the request is in progress
 *   - error: Error object if the request failed
 *   - refetch: Function to manually trigger a data refresh
 *
 * @example
 * ```typescript
 * const { data: suppliers, isLoading, error } = useMoneyMarketAssetSuppliers({
 *   reserveAddress: '0xabc...',
 *   offset: '0',
 *   limit: '20'
 * });
 *
 * if (isLoading) return <div>Loading suppliers...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (suppliers) {
 *   console.log('Total suppliers:', suppliers.total);
 *   console.log('Suppliers:', suppliers.suppliers);
 * }
 * ```
 *
 * @remarks
 * - The query is disabled when reserveAddress is undefined or empty
 * - Uses React Query for efficient caching and state management
 * - Automatically handles error states and loading indicators
 * - Supports pagination through offset and limit parameters
 */
export const useBackendMoneyMarketAssetSuppliers = (params: {
  reserveAddress: string | undefined;
  offset: string;
  limit: string;
}): UseQueryResult<MoneyMarketAssetSuppliers | undefined> => {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['backend', 'moneymarket', 'asset', 'suppliers', params],
    queryFn: async (): Promise<MoneyMarketAssetSuppliers | undefined> => {
      if (!params.reserveAddress || !params.offset || !params.limit) {
        return undefined;
      }

      return sodax.backendApiService.getMoneyMarketAssetSuppliers(params.reserveAddress, {
        offset: params.offset,
        limit: params.limit,
      });
    },
    enabled: !!params.reserveAddress && !!params.offset && !!params.limit,
    retry: 3,
  });
};
