import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import type { MoneyMarketPosition } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseBackendMoneyMarketPositionParams = {
  userAddress: string | undefined;
  queryOptions?: UseQueryOptions<MoneyMarketPosition | undefined, Error>;
};

/**
 * React hook for fetching a user's money market position from the backend API.
 *
 * @param {UseBackendMoneyMarketPositionParams | undefined} params - Parameters object:
 *   - userAddress: The user's wallet address to fetch positions for. If undefined or empty, the query is disabled.
 *   - queryOptions: (Optional) React Query options to customize behavior (e.g., staleTime, enabled).
 *
 * @returns {UseQueryResult<MoneyMarketPosition | undefined, Error>} - React Query result object with:
 *   - data: The user's money market position data, or undefined if not available.
 *   - isLoading: Loading state.
 *   - error: An Error instance if fetching failed.
 *   - refetch: Function to manually trigger a refetch.
 *
 * @example
 * const { data, isLoading, error } = useBackendMoneyMarketPosition({
 *   userAddress: '0xabc...',
 *   queryOptions: { staleTime: 60000 },
 * });
 */
export const useBackendMoneyMarketPosition = (
  params: UseBackendMoneyMarketPositionParams | undefined,
): UseQueryResult<MoneyMarketPosition | undefined, Error> => {
  const { sodax } = useSodaxContext();

  const defaultQueryOptions = {
    queryKey: ['api', 'mm', 'position', params?.userAddress],
    enabled: !!params?.userAddress && params?.userAddress.length > 0,
    retry: 3,
  };
  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions,
  };

  return useQuery({
    ...queryOptions,
    queryFn: async (): Promise<MoneyMarketPosition | undefined> => {
      if (!params?.userAddress) {
        return undefined;
      }
      return sodax.backendApi.getMoneyMarketPosition(params.userAddress);
    },
  });
};
