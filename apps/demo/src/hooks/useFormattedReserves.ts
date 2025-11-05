import {
  EvmHubProvider,
  MoneyMarketDataService,
  type ReservesDataHumanized,
  type FormatReserveUSDResponse,
  type ReserveDataWithPrice,
  type FormatReservesUSDRequest,
} from '@sodax/sdk';
import { useQuery } from '@tanstack/react-query';

/**
 * Fetches and formats all reserves with USD values from the Money Market SDK.
 * Returns a fully typed array of formatted reserve data.
 */
export function useFormattedReserves() {
  const { data } = useQuery({
    queryKey: ['formatted-reserves'],
    queryFn: async () => {
      const hubProvider = new EvmHubProvider();
      const mmDataService = new MoneyMarketDataService(hubProvider);

      const reservesHumanized: ReservesDataHumanized = await mmDataService.getReservesHumanized();

      const reservesWithPrice: FormatReservesUSDRequest<ReserveDataWithPrice> =
        mmDataService.buildReserveDataWithPrice(reservesHumanized);

      const formatted: (ReserveDataWithPrice & FormatReserveUSDResponse)[] =
        mmDataService.formatReservesUSD(reservesWithPrice);

      return formatted;
    },
  });

  return data; // Return just the data, like the old implementation
}
