import { type FormatUserSummaryResponse, type FormatReserveUSDResponse, SpokeProvider } from '@sodax/sdk';
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
 * const { data: userFormattedSummary, isLoading, error } = useUserFormattedSummary(spokeProvider, address);
 * ```
 *
 * @returns A React Query result object containing:
 *   - data: The formatted summary of Sodax user portfolio when available
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during data fetching
 */
export function useUserFormattedSummary(
  spokeProvider: SpokeProvider | undefined,
  address: string | undefined,
): UseQueryResult<FormatUserSummaryResponse<FormatReserveUSDResponse>, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['userFormattedSummary', spokeProvider?.chainConfig.chain.id, address],
    queryFn: async () => {
      if (!spokeProvider || !address) {
        throw new Error('Spoke provider or address is not defined');
      }

      // fetch reserves and hub wallet address
      const reserves = await sodax.moneyMarket.data.getReservesHumanized();

      // format reserves
      const formattedReserves = sodax.moneyMarket.data.formatReservesUSD(
        sodax.moneyMarket.data.buildReserveDataWithPrice(reserves),
      );

      // fetch user reserves
      const userReserves = await sodax.moneyMarket.data.getUserReservesHumanized(spokeProvider);

      // format user summary
      return sodax.moneyMarket.data.formatUserSummary(
        sodax.moneyMarket.data.buildUserSummaryRequest(reserves, formattedReserves, userReserves),
      );
    },
    enabled: !!spokeProvider && !!address,
    refetchInterval: 5000,
  });
}
