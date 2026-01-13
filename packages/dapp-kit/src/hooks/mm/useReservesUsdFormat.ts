import type { FormatReserveUSDResponse, ReserveData } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseReservesUsdFormatParams = {
  queryOptions?: UseQueryOptions<
    (ReserveData & { priceInMarketReferenceCurrency: string } & FormatReserveUSDResponse)[],
    Error
  >;
};

/**
 * Hook for fetching reserves data formatted with USD values in the Sodax money market.
 *
 * This hook returns an array of reserve objects, each extended with its price in the market reference
 * currency and formatted USD values. Data is automatically fetched and cached using React Query.
 *
 * @param params (optional) - Object including:
 *   - queryOptions: Custom React Query options such as `queryKey`, cache behavior, or refetching policy.
 *
 * @returns {UseQueryResult<(ReserveData & { priceInMarketReferenceCurrency: string } & FormatReserveUSDResponse)[], Error>} React Query result object containing:
 *   - data: Array of reserves with USD-formatted values, or undefined if loading
 *   - isLoading: Boolean loading state
 *   - isError: Boolean error state
 *   - error: Error object, if present
 *
 * @example
 * const { data: reservesUSD, isLoading, error } = useReservesUsdFormat();
 */
export function useReservesUsdFormat(
  params?: UseReservesUsdFormatParams,
): UseQueryResult<(ReserveData & { priceInMarketReferenceCurrency: string } & FormatReserveUSDResponse)[], Error> {
  const { sodax } = useSodaxContext();
  const defaultQueryOptions = { queryKey: ['mm', 'reservesUsdFormat'] };
  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions, // override default query options if provided
  };

  return useQuery({
    ...queryOptions,
    queryFn: async () => {
      const reserves = await sodax.moneyMarket.data.getReservesHumanized();
      return sodax.moneyMarket.data.formatReservesUSD(sodax.moneyMarket.data.buildReserveDataWithPrice(reserves));
    },
  });
}
