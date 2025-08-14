import { getMoneyMarketConfig, type SpokeProvider, WalletAbstractionService } from '@sodax/sdk';
import { useQuery } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

export function useUserReservesData(address: string | undefined, spokeProvider: SpokeProvider | undefined) {
  const { sodax } = useSodaxContext();
  const { hubProvider } = sodax;

  const { data: userReserves } = useQuery({
    queryKey: ['userReserves', address],
    queryFn: async () => {
      if (!hubProvider || !spokeProvider || !address) {
        return;
      }

      const hubWalletAddress = await WalletAbstractionService.getUserHubWalletAddress(
        address,
        spokeProvider,
        hubProvider,
      );

      const moneyMarketConfig = getMoneyMarketConfig(hubProvider.chainConfig.chain.id);
      const [res] = await sodax.moneyMarket.getUserReservesData(
        hubWalletAddress,
        moneyMarketConfig.uiPoolDataProvider,
        moneyMarketConfig.poolAddressesProvider,
      );

      return res;
    },
    enabled: !!spokeProvider && !!hubProvider && !!address,
    refetchInterval: 5000,
  });

  return userReserves;
}
