import { getMoneyMarketConfig } from '@sodax/sdk';
import type { HubChainId } from '@sodax/types';
import { useQuery } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
/**
 * Hook for fetching reserves data from the Sodax money market.
 *
 * This hook provides access to the current state of all reserves in the money market protocol,
 * including liquidity, interest rates, and other key metrics. The data is automatically
 * fetched and cached using React Query.
 *
 * @example
 * ```typescript
 * const { data: reservesData, isLoading, error } = useReservesData();
 * ```
 *
 * @returns A React Query result object containing:
 *   - data: The reserves data when available
 *   - isLoading: Loading state indicator
 *   - error: Any error that occurred during data fetching
 */

export function useReservesData() {
  const { sodax } = useSodaxContext();
  const hubChainId = (sodax.config?.hubProviderConfig?.chainConfig.chain.id ?? 'sonic') as HubChainId;

  return useQuery({
    queryKey: ['reservesData'],
    queryFn: async () => {
      const moneyMarketConfig = getMoneyMarketConfig(hubChainId);
      return await sodax.moneyMarket.getReservesData(
        moneyMarketConfig.uiPoolDataProvider,
        moneyMarketConfig.poolAddressesProvider,
      );
    },
  });
}
