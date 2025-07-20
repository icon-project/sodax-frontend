import {
  encodeAddress,
  EvmWalletAbstraction,
  getMoneyMarketConfig,
  SonicSpokeService,
  SONIC_MAINNET_CHAIN_ID,
  type SonicSpokeProvider,
  type EvmHubProvider,
} from '@sodax/sdk';
import type { HubChainId, SpokeChainId } from '@sodax/types';
import type { ChainId } from '@sodax/types';
import { useQuery } from '@tanstack/react-query';
import { useHubProvider } from '../provider/useHubProvider';
import { useSodaxContext } from '../shared/useSodaxContext';
import { useSpokeProvider } from '../provider/useSpokeProvider';
import type { Address } from 'viem';

export function useUserReservesData(spokeChainId: ChainId, address: string | undefined) {
  const { sodax } = useSodaxContext();
  const hubChainId = (sodax.config?.hubProviderConfig?.chainConfig.chain.id ?? 'sonic') as HubChainId;
  const hubProvider = useHubProvider();
  const spokeProvider = useSpokeProvider(spokeChainId);

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

      let userAddress: Address = hubWalletAddress;
      if (spokeChainId === SONIC_MAINNET_CHAIN_ID) {
        userAddress = await SonicSpokeService.getUserRouter(address as Address, spokeProvider as SonicSpokeProvider);
      }

      const moneyMarketConfig = getMoneyMarketConfig(hubChainId);
      const [res] = await sodax.moneyMarket.getUserReservesData(
        userAddress,
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
