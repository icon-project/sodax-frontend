import { useEffect, useState } from 'react';
import {
  EvmHubProvider,
  MoneyMarketDataService,
  type ReservesDataHumanized,
  type FormatReserveUSDResponse,
  type ReserveDataWithPrice,
  type FormatReservesUSDRequest,
} from '@sodax/sdk';

/**
 * Fetches and formats all reserves with USD values from the Money Market SDK.
 * Returns a fully typed array of formatted reserve data.
 */
export function useFormattedReserves() {
  const [formattedReserves, setFormattedReserves] = useState<(ReserveDataWithPrice & FormatReserveUSDResponse)[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const hubProvider = new EvmHubProvider();
      const mmDataService = new MoneyMarketDataService(hubProvider);

      // Fetch humanized reserves data
      const reservesHumanized: ReservesDataHumanized = await mmDataService.getReservesHumanized();

      // Build data with price
      const reservesWithPrice: FormatReservesUSDRequest<ReserveDataWithPrice> =
        mmDataService.buildReserveDataWithPrice(reservesHumanized);

      // Format reserves into USD
      const formatted: (ReserveDataWithPrice & FormatReserveUSDResponse)[] =
        mmDataService.formatReservesUSD(reservesWithPrice);

      setFormattedReserves(formatted);
    };

    fetchData();
  }, []);

  return formattedReserves;
}
