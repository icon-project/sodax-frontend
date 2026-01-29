import type { FormatUserSummaryResponse, FormatReserveUSDResponse, SpokeProvider } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseUserFormattedSummaryParams = {
  spokeProvider?: SpokeProvider;
  address?: string;
  queryOptions?: UseQueryOptions<FormatUserSummaryResponse<FormatReserveUSDResponse>, Error>;
};

/**
 * React hook to fetch a formatted summary of a user's Sodax money market portfolio.
 *
 * Accepts an optional params object:
 *   - `spokeProvider`: The SpokeProvider instance for the target chain
 *   - `address`: The user wallet address to get the summary for
 *   - `queryOptions`: Optional React Query options (key, caching, intervals, etc)
 *
 * The hook returns a React Query result object containing the formatted summary, loading and error state.
 * The query is enabled only if both the spokeProvider and address are provided.
 *
 * @param params Optional parameters:
 *   - spokeProvider: SpokeProvider to query chain data (required for enabled query)
 *   - address: User account address (required for enabled query)
 *   - queryOptions: React Query options for customization (optional)
 *
 * @returns {UseQueryResult<FormatUserSummaryResponse<FormatReserveUSDResponse>, Error>}
 *   A result object from React Query including:
 *     - data: The user's formatted portfolio summary (or undefined if not loaded)
 *     - isLoading: Boolean loading state
 *     - isError: Boolean error state
 *     - error: Error if thrown in fetching
 *
 * @example
 * const { data, isLoading, error } = useUserFormattedSummary({ spokeProvider, address });
 */
export function useUserFormattedSummary(
  params?: UseUserFormattedSummaryParams,
): UseQueryResult<FormatUserSummaryResponse<FormatReserveUSDResponse>, Error> {
  const { sodax } = useSodaxContext();
  const defaultQueryOptions = {
    queryKey: ['mm', 'userFormattedSummary', params?.spokeProvider?.chainConfig.chain.id, params?.address],
    enabled: !!params?.spokeProvider && !!params?.address,
    refetchInterval: 5000,
  };

  const queryOptions = {
    ...defaultQueryOptions,
    ...params?.queryOptions, // override default query options if provided
  }

  return useQuery({
    ...queryOptions,
    queryFn: async () => {
      if (!params?.spokeProvider || !params?.address) {
        throw new Error('Spoke provider or address is not defined');
      }

      // fetch reserves and hub wallet address
      const reserves = await sodax.moneyMarket.data.getReservesHumanized();

      // format reserves
      const formattedReserves = sodax.moneyMarket.data.formatReservesUSD(
        sodax.moneyMarket.data.buildReserveDataWithPrice(reserves),
      );

      // fetch user reserves
      const userReserves = await sodax.moneyMarket.data.getUserReservesHumanized(params?.spokeProvider);

      // format user summary
      return sodax.moneyMarket.data.formatUserSummary(
        sodax.moneyMarket.data.buildUserSummaryRequest(reserves, formattedReserves, userReserves),
      );
    },
  });
}
