import { allXTokens } from '@/core';
import { encodeAddress, EvmWalletAbstraction, getMoneyMarketConfig, type EvmHubProvider } from '@sodax/sdk';
import type { HubChainId, SpokeChainId } from '@sodax/types';
import type { ChainId } from '@sodax/types';
import { useQuery } from '@tanstack/react-query';
import { useHubProvider } from '../provider/useHubProvider';
import { useSodaxContext } from '../shared/useSodaxContext';

export function useUserReservesData(spokeChainId: ChainId, address: string | undefined) {
  const { sodax } = useSodaxContext();
  const hubChainId = (sodax.config?.hubProviderConfig?.chainConfig.chain.id ?? 'sonic') as HubChainId;
  const hubProvider = useHubProvider();

  const { data: userReserves } = useQuery({
    queryKey: ['userReserves', spokeChainId, address],
    queryFn: async () => {
      if (!hubProvider || !address) {
        return;
      }

      const addressBytes = encodeAddress(spokeChainId, address);
      const hubWalletAddress = await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeChainId as SpokeChainId,
        addressBytes,
        hubProvider as EvmHubProvider,
      );

      const moneyMarketConfig = getMoneyMarketConfig(hubChainId);
      const [res] = await sodax.moneyMarket.getUserReservesData(
        hubWalletAddress as `0x${string}`,
        moneyMarketConfig.uiPoolDataProvider,
        moneyMarketConfig.poolAddressesProvider,
      );

      return res?.map(r => {
        return {
          ...r,
          token: allXTokens.find(t => t.address === r.underlyingAsset),
        };
      });
    },
    enabled: !!spokeChainId && !!hubProvider && !!address,
    refetchInterval: 5000,
  });

  return userReserves;
}
