// packages/dapp-kit/src/hooks/backend/useAllMoneyMarketBorrowers.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { MoneyMarketBorrowers } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for fetching all money market borrowers from the backend API.
 *
 * This hook provides access to the list of all borrowers across all money market assets,
 * with pagination support. The data is automatically fetched and cached using React Query.
 *
 * @param {Object} params - Pagination parameters for fetching all borrowers
 * @param {string} params.offset - The offset for pagination (number as string)
 * @param {string} params.limit - The limit for pagination (number as string)
 *
 * @returns {UseQueryResult<MoneyMarketBorrowers | undefined>} A query result object containing:
 *   - data: The all borrowers data when available
 *   - isLoading: Boolean indicating if the request is in progress
 *   - error: Error object if the request failed
 *   - refetch: Function to manually trigger a data refresh
 *
 * @example
 * ```typescript
 * const { data: borrowers, isLoading, error } = useAllMoneyMarketBorrowers({
 *   offset: '0',
 *   limit: '50'
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
 * - The query is disabled when params are undefined or invalid
 * - Uses React Query for efficient caching and state management
 * - Automatically handles error states and loading indicators
 * - Supports pagination through offset and limit parameters
 * - Returns borrowers across all money market assets
 */
export const useBackendAllMoneyMarketBorrowers = (
  params: { offset: string; limit: string } | undefined,
): UseQueryResult<MoneyMarketBorrowers | undefined> => {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['backend', 'moneymarket', 'borrowers', 'all', params],
    queryFn: async (): Promise<MoneyMarketBorrowers | undefined> => {
      if (!params || !params.offset || !params.limit) {
        return undefined;
      }

      return sodax.backendApiService.getAllMoneyMarketBorrowers(params);
    },
    enabled: !!params && !!params.offset && !!params.limit,
    retry: 3,
  });
};
