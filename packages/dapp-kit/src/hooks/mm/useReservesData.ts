import { getMoneyMarketConfig } from '@sodax/sdk';
import type { HubChainId } from '@sodax/types';
import { useQuery } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

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
