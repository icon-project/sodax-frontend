// packages/dapp-kit/src/hooks/backend/useAllMoneyMarketAssets.ts
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import type { MoneyMarketAsset } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseBackendAllMoneyMarketAssetsParams = {
  queryOptions?: UseQueryOptions<MoneyMarketAsset[], Error>;
};

/**
 * React hook to fetch all money market assets from the backend API.
 *
 * @param {UseBackendAllMoneyMarketAssetsParams | undefined} params - Optional parameters:
 *   - `queryOptions` (optional): React Query options to override default behavior (e.g., caching, retry, etc).
 *
 * @returns {UseQueryResult<MoneyMarketAsset[], Error>} React Query result object:
 *   - `data`: Array of all money market asset data when available.
 *   - `isLoading`: Boolean indicating if the request is in progress.
 *   - `error`: Error object if the request failed.
 *   - `refetch`: Function to manually trigger a data refresh.
 *
 * @example
 * const { data: assets, isLoading, error } = useBackendAllMoneyMarketAssets();
 *
 * if (isLoading) return <div>Loading assets...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (assets) {
 *   console.log('Total assets:', assets.length);
 *   assets.forEach(asset => {
 *     console.log(`${asset.symbol}: ${asset.liquidityRate} liquidity rate`);
 *   });
 * }
 *
 * @remarks
 * - No required parameters — fetches all available money market assets from backend.
 * - Uses React Query for caching, retries, and loading/error state management.
 * - Supports overriding React Query config via `queryOptions`.
 */
export const useBackendAllMoneyMarketAssets = (
  params: UseBackendAllMoneyMarketAssetsParams | undefined,
): UseQueryResult<MoneyMarketAsset[], Error> => {
  const { sodax } = useSodaxContext();

  const defaultQueryOptions = {
    queryKey: ['api', 'mm', 'assets', 'all'],
    enabled: true,
    retry: 3,
  };
  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions,
  };

  return useQuery({
    ...queryOptions,
    queryFn: async (): Promise<MoneyMarketAsset[]> => {
      return sodax.backendApi.getAllMoneyMarketAssets();
    },
  });
};
