import { getMoneyMarketConfig, type SpokeProvider, WalletAbstractionService } from '@sodax/sdk';
import type { HubChainId } from '@sodax/types';
import { useQuery } from '@tanstack/react-query';
import { useHubProvider } from '../provider/useHubProvider';
import { useSodaxContext } from '../shared/useSodaxContext';

export function useUserReservesData(address: string | undefined, spokeProvider: SpokeProvider | undefined) {
  const { sodax } = useSodaxContext();
  const hubChainId = (sodax.config?.hubProviderConfig?.chainConfig.chain.id ?? 'sonic') as HubChainId;
  const hubProvider = useHubProvider();

  const { data: userReserves } = useQuery({
    queryKey: ['userReserves', hubChainId, address],
    queryFn: async () => {
      if (!hubProvider || !spokeProvider || !address) {
        return;
      }

      const hubWalletAddress = await WalletAbstractionService.getUserHubWalletAddress(
        address,
        spokeProvider,
        hubProvider,
      );

      const moneyMarketConfig = getMoneyMarketConfig(hubChainId);
      const [res] = await sodax.moneyMarket.getUserReservesData(
        hubWalletAddress,
        moneyMarketConfig.uiPoolDataProvider,
        moneyMarketConfig.poolAddressesProvider,
      );

      return res;
    },
    enabled: !!spokeProvider && !!hubChainId && !!hubProvider && !!address,
    refetchInterval: 5000,
  });

  return userReserves;
}
