import type { FormatReserveUSDResponse, ReserveData } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for fetching reserves data formatted in USD from the Sodax money market.
 *
 * This hook provides access to all reserves in the money market protocol with computed fields
 * (APY, APR, liquidity, debt, etc.) normalized to human-readable decimals and converted to USD.
 * The data includes reserve configuration, live usage metrics, and USD-denominated values.
 * The data is automatically fetched and cached using React Query.
 *
 * @example
 * ```typescript
 * const { data: formattedReserves, isLoading, error } = useReservesUsdFormat();
 * ```
 *
 * @returns A React Query result object containing:
 *   - data: An array of formatted reserve data with USD values when available
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during data fetching
 */
export function useReservesUsdFormat(): UseQueryResult<
  (ReserveData & { priceInMarketReferenceCurrency: string } & FormatReserveUSDResponse)[],
  Error
> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['reservesUsdFormat'],
    queryFn: async () => {
      // fetch reserves and hub wallet address
      const reserves = await sodax.moneyMarket.data.getReservesHumanized();

      // format reserves
      return sodax.moneyMarket.data.formatReservesUSD(sodax.moneyMarket.data.buildReserveDataWithPrice(reserves));
    },
  });
}
