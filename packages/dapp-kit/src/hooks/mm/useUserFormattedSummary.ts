import type { FormatReserveUSDResponse, FormatUserSummaryResponse } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseUserFormattedSummaryParams = {
  spokeChainKey: SpokeChainKey | undefined;
  userAddress: string | undefined;
  queryOptions?: Omit<
    UseQueryOptions<FormatUserSummaryResponse<FormatReserveUSDResponse>, Error>,
    'queryKey' | 'queryFn' | 'enabled'
  >;
};

/**
 * React hook returning the user's formatted money market portfolio summary (collateral, borrows,
 * health factor, available borrow power, etc.) for the given spoke chain.
 *
 * Internally chains `getReservesHumanized` → `formatReservesUSD` → `getUserReservesHumanized`
 * → `formatUserSummary`.
 */
export function useUserFormattedSummary({
  spokeChainKey,
  userAddress,
  queryOptions,
}: UseUserFormattedSummaryParams): UseQueryResult<FormatUserSummaryResponse<FormatReserveUSDResponse>, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['mm', 'userFormattedSummary', spokeChainKey, userAddress],
    queryFn: async () => {
      if (!spokeChainKey || !userAddress) {
        throw new Error('spokeChainKey and userAddress are required');
      }

      const [reserves, userReserves] = await Promise.all([
        sodax.moneyMarket.data.getReservesHumanized(),
        sodax.moneyMarket.data.getUserReservesHumanized(spokeChainKey, userAddress),
      ]);
      const formattedReserves = sodax.moneyMarket.data.formatReservesUSD(
        sodax.moneyMarket.data.buildReserveDataWithPrice(reserves),
      );

      return sodax.moneyMarket.data.formatUserSummary(
        sodax.moneyMarket.data.buildUserSummaryRequest(reserves, formattedReserves, userReserves),
      );
    },
    enabled: !!spokeChainKey && !!userAddress,
    refetchInterval: 5000,
    ...queryOptions,
  });
}
