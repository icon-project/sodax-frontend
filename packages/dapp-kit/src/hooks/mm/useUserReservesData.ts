import { allXTokens } from '@/core';
import { getMoneyMarketConfig, type EvmHubProvider } from '@sodax/sdk';
import type { HubChainId, SpokeChainId } from '@sodax/types';
import { useXAccount, useWalletProvider } from '@sodax/wallet-sdk';
import type { ChainId } from '@sodax/types';
import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { useHubProvider } from '../provider/useHubProvider';
import { useHubWalletAddress } from './useHubWalletAddress';
import { useSodaxContext } from '../shared/useSodaxContext';

export function useUserReservesData(spokeChainId: ChainId) {
  const { sodax } = useSodaxContext();
  const hubChainId = (sodax.config?.hubProviderConfig?.chainConfig.chain.id ?? 'sonic') as HubChainId;
  const hubWalletProvider = useWalletProvider(hubChainId);
  const hubProvider = useHubProvider();
  const { address } = useXAccount(spokeChainId);
  const { data: hubWalletAddress } = useHubWalletAddress(
    spokeChainId as SpokeChainId,
    address,
    hubProvider as EvmHubProvider,
  );

  const { data: userReserves } = useQuery({
    queryKey: ['userReserves', hubWalletAddress],
    queryFn: async () => {
      if (!hubWalletProvider) {
        return;
      }

      if (!hubWalletAddress) {
        return;
      }

      const moneyMarketConfig = getMoneyMarketConfig(hubChainId);
      try {
        const [res] = await sodax.moneyMarket.getUserReservesData(
          hubWalletAddress as Address,
          moneyMarketConfig.uiPoolDataProvider as Address,
          moneyMarketConfig.poolAddressesProvider as Address,
        );

        return res?.map(r => {
          return {
            ...r,
            token: allXTokens.find(t => t.address === r.underlyingAsset),
          };
        });
      } catch (error) {
        console.log('error', error);
        return;
      }
    },
    enabled: !!address && !!hubWalletProvider && !!hubWalletAddress,
    refetchInterval: 5000,
  });

  return userReserves;
}
