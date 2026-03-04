// packages/dapp-kit/src/hooks/backend/useMoneyMarketAsset.ts
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import type { MoneyMarketAsset } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseBackendMoneyMarketAssetParams = {
  params: {
    reserveAddress: string | undefined;
  };
  queryOptions?: UseQueryOptions<MoneyMarketAsset | undefined, Error>;
};

/**
 * React hook to fetch a specific money market asset from the backend API.
 *
 * @param params - The hook input parameter object (may be undefined):
 *   - `params`: An object containing:
 *       - `reserveAddress` (string | undefined): Reserve contract address to fetch asset details. Disables query if undefined or empty.
 *   - `queryOptions` (optional): React Query options for advanced configuration (e.g. caching, staleTime, retry, etc.).
 *
 * @returns A React Query result object: {@link UseQueryResult} for {@link MoneyMarketAsset} or `undefined` on error or if disabled,
 *   including:
 *   - `data`: The money market asset (when available) or `undefined`.
 *   - `isLoading`: Whether the query is running.
 *   - `error`: An error encountered by the query (if any).
 *   - `refetch`: Function to manually refetch the asset.
 *
 * @example
 * const { data: asset, isLoading, error } = useBackendMoneyMarketAsset({
 *   params: { reserveAddress: '0xabc...' },
 * });
 * if (isLoading) return <div>Loading asset...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (asset) {
 *   console.log('Asset symbol:', asset.symbol);
 *   console.log('Liquidity rate:', asset.liquidityRate);
 *   console.log('Variable borrow rate:', asset.variableBorrowRate);
 * }
 *
 * @remarks
 * - Query is disabled if `params`, `params.params`, or `params.params.reserveAddress` is missing or empty.
 * - Uses React Query for caching and background-state management.
 * - Loading and error handling are managed automatically.
 */
export const useBackendMoneyMarketAsset = (
  params: UseBackendMoneyMarketAssetParams | undefined,
): UseQueryResult<MoneyMarketAsset | undefined, Error> => {
  const { sodax } = useSodaxContext();

  const defaultQueryOptions = {
    queryKey: ['api', 'mm', 'asset', params?.params?.reserveAddress],
    enabled: !!params?.params?.reserveAddress && params?.params?.reserveAddress.length > 0,
    retry: 3,
  };
  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions,
  };

  return useQuery({
    ...queryOptions,
    queryFn: async (): Promise<MoneyMarketAsset | undefined> => {
      if (!params?.params?.reserveAddress) {
        return undefined;
      }

      return sodax.backendApi.getMoneyMarketAsset(params.params.reserveAddress);
    },
  });
};
