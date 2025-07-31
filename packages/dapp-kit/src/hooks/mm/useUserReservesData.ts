import { getMoneyMarketConfig, WalletAbstractionService } from '@sodax/sdk';
import type { HubChainId } from '@sodax/types';
import type { ChainId } from '@sodax/types';
import { useQuery } from '@tanstack/react-query';
import { useHubProvider } from '../provider/useHubProvider';
import { useSodaxContext } from '../shared/useSodaxContext';
import { useSpokeProvider } from '../provider/useSpokeProvider';

export function useUserReservesData(spokeChainId: ChainId, address: string | undefined) {
  const { sodax } = useSodaxContext();
  const hubChainId = (sodax.config?.hubProviderConfig?.chainConfig.chain.id ?? 'sonic') as HubChainId;
  const hubProvider = useHubProvider();
  const spokeProvider = useSpokeProvider(spokeChainId);

  const { data: userReserves } = useQuery({
    queryKey: ['userReserves', spokeChainId, address],
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
    enabled: !!spokeChainId && !!hubProvider && !!address,
    refetchInterval: 5000,
  });

  return userReserves;
}
