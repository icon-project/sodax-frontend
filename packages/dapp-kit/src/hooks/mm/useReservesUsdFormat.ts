import type { FormatReserveUSDResponse, ReserveDataHumanized } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type ReserveUsdFormat = ReserveDataHumanized & FormatReserveUSDResponse;

export type UseReservesUsdFormatParams = {
  queryOptions?: Omit<UseQueryOptions<ReserveUsdFormat[], Error>, 'queryKey' | 'queryFn'>;
};

/**
 * React hook returning reserves with USD-formatted values for the Sodax money market.
 * Chains `getReservesHumanized` → `buildReserveDataWithPrice` → `formatReservesUSD`.
 */
export function useReservesUsdFormat(
  params?: UseReservesUsdFormatParams,
): UseQueryResult<ReserveUsdFormat[], Error> {
  const { sodax } = useSodaxContext();

  return useQuery<ReserveUsdFormat[], Error>({
    queryKey: ['mm', 'reservesUsdFormat'],
    queryFn: async () => {
      const reserves = await sodax.moneyMarket.data.getReservesHumanized();
      return sodax.moneyMarket.data.formatReservesUSD(
        sodax.moneyMarket.data.buildReserveDataWithPrice(reserves),
      );
    },
    ...params?.queryOptions,
  });
}
