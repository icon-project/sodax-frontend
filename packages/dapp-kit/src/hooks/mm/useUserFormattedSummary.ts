import { type FormatUserSummaryResponse, type FormatReserveUSDResponse, WalletAbstractionService } from '@sodax/sdk';
import type { ChainId } from '@sodax/types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import { useSpokeProvider } from '../provider/useSpokeProvider';

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
export function useUserFormattedSummary(
  spokeChainId: ChainId | undefined,
  address: string | undefined,
): UseQueryResult<FormatUserSummaryResponse<FormatReserveUSDResponse> | undefined, Error> {
  const { sodax } = useSodaxContext();
  const spokeProvider = useSpokeProvider(spokeChainId);

  return useQuery({
    queryKey: ['userFormattedSummary', spokeChainId, address],
    queryFn: async () => {
      if (!spokeProvider || !address) {
        return undefined;
      }

      // fetch reserves and hub wallet address
      const [hubWalletAddress, reserves] = await Promise.all([
        WalletAbstractionService.getUserHubWalletAddress(address, spokeProvider, sodax.hubProvider),
        sodax.moneyMarket.data.getReservesHumanized(),
      ]);

      // format reserves
      const formattedReserves = sodax.moneyMarket.data.formatReservesUSD(
        sodax.moneyMarket.data.buildReserveDataWithPrice(reserves),
      );

      // fetch user reserves
      const userReserves = await sodax.moneyMarket.data.getUserReservesHumanized(hubWalletAddress);

      // format user summary
      return sodax.moneyMarket.data.formatUserSummary(
        sodax.moneyMarket.data.buildUserSummaryRequest(reserves, formattedReserves, userReserves),
      );
    },
    enabled: !!spokeChainId && !!address,
    refetchInterval: 5000,
  });
}
