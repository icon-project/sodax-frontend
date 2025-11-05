import {
  EvmHubProvider,
  MoneyMarketDataService,
  type ReservesDataHumanized,
  type FormatReserveUSDResponse,
  type ReserveDataWithPrice,
  type FormatReservesUSDRequest,
} from '@sodax/sdk';
import { useQuery } from '@tanstack/react-query';

// Export this type - it matches exactly what the SDK's formatReserves returns
export type FormattedReserve = ReserveDataWithPrice & FormatReserveUSDResponse;

/**
 * Fetches and formats all reserves with USD values from the Money Market SDK.
 * Returns a fully typed array of formatted reserve data.
 */
export function useFormattedReserves() {
  return useQuery({
    queryKey: ['formatted-reserves'],
    queryFn: async (): Promise<FormattedReserve[]> => {
      const hubProvider = new EvmHubProvider();
      const mmDataService = new MoneyMarketDataService(hubProvider);

      const reservesHumanized: ReservesDataHumanized = await mmDataService.getReservesHumanized();

      const reservesWithPrice: FormatReservesUSDRequest<ReserveDataWithPrice> =
        mmDataService.buildReserveDataWithPrice(reservesHumanized);

      const formatted: FormattedReserve[] = mmDataService.formatReservesUSD(reservesWithPrice);

      return formatted;
    },
  });
}
