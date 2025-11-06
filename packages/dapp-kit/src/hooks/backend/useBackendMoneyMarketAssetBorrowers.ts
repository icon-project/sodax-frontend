// packages/dapp-kit/src/hooks/backend/useMoneyMarketAssetBorrowers.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { MoneyMarketAssetBorrowers } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for fetching borrowers for a specific money market asset from the backend API.
 *
 * This hook provides access to the list of borrowers for a specific money market asset,
 * with pagination support. The data is automatically fetched and cached using React Query.
 *
 * @param {Object} params - Parameters for fetching asset borrowers
 * @param {string | undefined} params.reserveAddress - The reserve contract address. If undefined, the query will be disabled.
 * @param {string} params.offset - The offset for pagination (number as string)
 * @param {string} params.limit - The limit for pagination (number as string)
 *
 * @returns {UseQueryResult<MoneyMarketAssetBorrowers | undefined>} A query result object containing:
 *   - data: The asset borrowers data when available
 *   - isLoading: Boolean indicating if the request is in progress
 *   - error: Error object if the request failed
 *   - refetch: Function to manually trigger a data refresh
 *
 * @example
 * ```typescript
 * const { data: borrowers, isLoading, error } = useMoneyMarketAssetBorrowers({
 *   reserveAddress: '0xabc...',
 *   offset: '0',
 *   limit: '20'
 * });
 *
 * if (isLoading) return <div>Loading borrowers...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (borrowers) {
 *   console.log('Total borrowers:', borrowers.total);
 *   console.log('Borrowers:', borrowers.borrowers);
 * }
 * ```
 *
 * @remarks
 * - The query is disabled when reserveAddress is undefined or empty
 * - Uses React Query for efficient caching and state management
 * - Automatically handles error states and loading indicators
 * - Supports pagination through offset and limit parameters
 */
export const useBackendMoneyMarketAssetBorrowers = (params: {
  reserveAddress: string | undefined;
  offset: string;
  limit: string;
}): UseQueryResult<MoneyMarketAssetBorrowers | undefined> => {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['backend', 'moneymarket', 'asset', 'borrowers', params],
    queryFn: async (): Promise<MoneyMarketAssetBorrowers | undefined> => {
      if (!params.reserveAddress || !params.offset || !params.limit) {
        return undefined;
      }

      return sodax.backendApi.getMoneyMarketAssetBorrowers(params.reserveAddress, {
        offset: params.offset,
        limit: params.limit,
      });
    },
    enabled: !!params.reserveAddress && !!params.offset && !!params.limit,
    retry: 3,
  });
};
