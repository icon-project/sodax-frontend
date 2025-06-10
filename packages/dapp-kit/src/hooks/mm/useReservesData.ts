import { getMoneyMarketConfig } from '@sodax/sdk';
import { useQuery } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';

export function useReservesData() {
  const { hubChainId, sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['reservesData'],
    queryFn: async () => {
      const moneyMarketConfig = getMoneyMarketConfig(hubChainId);
      try {
        const [reservesData] = await sodax.moneyMarket.getReservesData(
          moneyMarketConfig.uiPoolDataProvider,
          moneyMarketConfig.poolAddressesProvider,
        );
        console.log('res', reservesData);
        return reservesData;

        //   return res?.map(r => {
        //     return {
        //       ...r,
        //       token: allXTokens.find(t => t.address === r.underlyingAsset),
        //     };
        //   });
      } catch (error) {
        console.log('error', error);
        return;
      }
    },
    refetchInterval: 5000,
  });
}
