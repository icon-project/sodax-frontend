import { useSodaxContext } from '@sodax/dapp-kit';
import type { FormatReserveUSDResponse, ReserveDataWithPrice } from '@sodax/sdk';
import { useQuery } from '@tanstack/react-query';

// Export this type - it matches exactly what the SDK's formatReserves returns
export type FormattedReserve = ReserveDataWithPrice & FormatReserveUSDResponse;

/**
 * Fetches and formats all reserves with USD values from the Money Market SDK.
 * Returns a fully typed array of formatted reserve data.
 */
export function useFormattedReserves() {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['formatted-reserves'],
    queryFn: async (): Promise<FormattedReserve[]> => {
      // This is the exact pattern from useUserFormattedSummary
      const reserves = await sodax.moneyMarket.data.getReservesHumanized();

      const formattedReserves = sodax.moneyMarket.data.formatReservesUSD(
        sodax.moneyMarket.data.buildReserveDataWithPrice(reserves),
      );

      return formattedReserves;
    },
  });
}
