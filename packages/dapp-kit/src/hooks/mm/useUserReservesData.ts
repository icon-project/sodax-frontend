import { allXTokens } from '@/core';
import { EvmWalletAbstraction, getMoneyMarketConfig, type EvmHubProvider } from '@sodax/sdk';
import type { HubChainId, SpokeChainId } from '@sodax/types';
import type { ChainId } from '@sodax/types';
import { useQuery } from '@tanstack/react-query';
import { useHubProvider } from '../provider/useHubProvider';
import { useSodaxContext } from '../shared/useSodaxContext';
import { useSpokeProvider } from '../provider/useSpokeProvider';

export function useUserReservesData(spokeChainId: ChainId) {
  const { sodax } = useSodaxContext();
  const hubChainId = (sodax.config?.hubProviderConfig?.chainConfig.chain.id ?? 'sonic') as HubChainId;
  const hubProvider = useHubProvider();
  const spokeProvider = useSpokeProvider(spokeChainId as SpokeChainId);

  const { data: userReserves } = useQuery({
    queryKey: ['userReserves', spokeChainId],
    queryFn: async () => {
      if (!hubProvider) {
        return;
      }

      if (!spokeProvider) {
        return;
      }

      const addressBytes = await spokeProvider.walletProvider.getWalletAddressBytes();
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
    enabled: !!spokeProvider && !!hubProvider,
    refetchInterval: 5000,
  });

  return userReserves;
}
