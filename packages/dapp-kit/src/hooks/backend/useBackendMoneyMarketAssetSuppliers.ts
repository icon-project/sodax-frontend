// packages/dapp-kit/src/hooks/backend/useMoneyMarketAssetSuppliers.ts
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import type { MoneyMarketAssetSuppliers } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { BackendPaginationParams } from './types';

export type UseBackendMoneyMarketAssetSuppliersParams = {
  params: {
    reserveAddress: string | undefined;
  };
  pagination: BackendPaginationParams;
  queryOptions?: UseQueryOptions<MoneyMarketAssetSuppliers | undefined, Error>;
};

/**
 * React hook for fetching suppliers for a specific money market asset from the backend API, with pagination support.
 *
 * @param {UseBackendMoneyMarketAssetSuppliersParams | undefined} params - Hook parameters:
 *   - `params`: Object containing:
 *       - `reserveAddress`: The reserve contract address to query, or undefined to disable the query.
 *   - `pagination`: Backend pagination controls (`offset` and `limit` as strings).
 *   - `queryOptions` (optional): React Query options to override defaults.
 *
 * @returns {UseQueryResult<MoneyMarketAssetSuppliers | undefined, Error>} - Query result object with:
 *   - `data`: The asset suppliers data when available.
 *   - `isLoading`: Indicates if the request is in progress.
 *   - `error`: Error object if the request failed.
 *   - `refetch`: Function to trigger a manual data refresh.
 *
 * @example
 * const { data: suppliers, isLoading, error } = useBackendMoneyMarketAssetSuppliers({
 *   params: { reserveAddress: '0xabc...' },
 *   pagination: { offset: '0', limit: '20' }
 * });
 *
 * if (isLoading) return <div>Loading suppliers...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (suppliers) {
 *   console.log('Total suppliers:', suppliers.total);
 *   console.log('Suppliers:', suppliers.suppliers);
 * }
 *
 * @remarks
 * - The query is disabled if `reserveAddress`, `offset`, or `limit` are not provided.
 * - Uses React Query for efficient caching, automatic retries, and error/loading handling.
 * - Pagination is handled via `pagination.offset` and `pagination.limit`.
 */
export const useBackendMoneyMarketAssetSuppliers = (
  params: UseBackendMoneyMarketAssetSuppliersParams | undefined,
): UseQueryResult<MoneyMarketAssetSuppliers | undefined, Error> => {
  const { sodax } = useSodaxContext();

  const defaultQueryOptions = {
    queryKey: ['api', 'mm', 'asset', 'suppliers', params],
    enabled: !!params?.params?.reserveAddress && !!params.pagination.offset && !!params.pagination.limit,
    retry: 3,
  };
  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions,
  };

  return useQuery({
    ...queryOptions,
    queryFn: async (): Promise<MoneyMarketAssetSuppliers | undefined> => {
      if (!params?.params?.reserveAddress || !params.pagination.offset || !params.pagination.limit) {
        return undefined;
      }

      return sodax.backendApi.getMoneyMarketAssetSuppliers(params.params.reserveAddress, {
        offset: params.pagination.offset,
        limit: params.pagination.limit,
      });
    },
  });
};
