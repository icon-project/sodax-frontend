// packages/dapp-kit/src/hooks/backend/useMoneyMarketAssetBorrowers.ts
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import type { MoneyMarketAssetBorrowers } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { BackendPaginationParams } from './types';

export type UseBackendMoneyMarketAssetBorrowersParams = {
  params: {
    reserveAddress: string | undefined;
  };
  pagination: BackendPaginationParams;
  queryOptions?: UseQueryOptions<MoneyMarketAssetBorrowers | undefined, Error>;
};

/**
 * React hook for fetching borrowers for a specific money market asset from the backend API with pagination.
 *
 * @param {UseBackendMoneyMarketAssetBorrowersParams | undefined} params - Query parameters:
 *   - `params`: Object containing:
 *       - `reserveAddress`: Reserve contract address for which to fetch borrowers, or `undefined` to disable query.
 *   - `pagination`: Pagination controls with `offset` and `limit` (both required as strings).
 *   - `queryOptions` (optional): React Query options to override defaults (e.g. `staleTime`, `enabled`, etc.).
 *
 * @returns {UseQueryResult<MoneyMarketAssetBorrowers | undefined, Error>} React Query result object including:
 *   - `data`: The money market asset borrowers data, or `undefined` if not available.
 *   - `isLoading`: Boolean indicating whether the query is loading.
 *   - `error`: An Error instance if the request failed.
 *   - `refetch`: Function to manually trigger a data refresh.
 *
 * @example
 * const { data: borrowers, isLoading, error } = useBackendMoneyMarketAssetBorrowers({
 *   params: { reserveAddress: '0xabc...' },
 *   pagination: { offset: '0', limit: '20' }
 * });
 *
 * if (isLoading) return <div>Loading borrowers...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (borrowers) {
 *   console.log('Total borrowers:', borrowers.total);
 *   console.log('Borrowers:', borrowers.borrowers);
 * }
 *
 * @remarks
 * - The query is disabled if `reserveAddress`, `offset`, or `limit` are not provided.
 * - Uses React Query for caching, retries, and auto error/loading management.
 * - Pagination is handled via `pagination.offset` and `pagination.limit`.
 */
export const useBackendMoneyMarketAssetBorrowers = (
  params: UseBackendMoneyMarketAssetBorrowersParams | undefined,
): UseQueryResult<MoneyMarketAssetBorrowers | undefined, Error> => {
  const { sodax } = useSodaxContext();

  const defaultQueryOptions = {
    queryKey: ['api', 'mm', 'asset', 'borrowers', params],
    enabled: !!params?.params?.reserveAddress && !!params.pagination.offset && !!params.pagination.limit,
    retry: 3,
  };
  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions,
  };

  return useQuery({
    ...queryOptions,
    queryFn: async (): Promise<MoneyMarketAssetBorrowers | undefined> => {
      if (!params?.params?.reserveAddress || !params.pagination.offset || !params.pagination.limit) {
        return undefined;
      }

      return sodax.backendApi.getMoneyMarketAssetBorrowers(params.params.reserveAddress, {
        offset: params.pagination.offset,
        limit: params.pagination.limit,
      });
    },
  });
};
