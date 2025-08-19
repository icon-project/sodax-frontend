import type { FormatReserveUSDResponse, ReserveData } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

/**
 * Hook for fetching formatted summary of Sodax user portfolio (holdings, total liquidity,
 *  collateral, borrows, liquidation threshold, health factor, available borrowing power, etc..).
 *
 * This hook provides access to the current state of user portfolio in the money market protocol.
 * The data is automatically fetched and cached using React Query.
 *
 * @example
 * ```typescript
 * const { data: userFormattedSummary, isLoading, error } = useUserFormattedSummary();
 * ```
 *
 * @returns A React Query result object containing:
 *   - data: The formatted summary of Sodax user portfolio when available
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
