import { allXTokens } from '@/core';
import { getMoneyMarketConfig, type SpokeChainId, type EvmHubProvider } from '@sodax/sdk';
import { getXChainType, useXAccount, type XChainId } from '@sodax/wallet-sdk';
import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { useHubProvider } from '../provider/useHubProvider';
import { useHubWalletAddress } from './useHubWalletAddress';
import { useWalletProvider } from '../provider/useWalletProvider';
import { useSodaxContext } from '../shared/useSodaxContext';

export function useUserReservesData(spokeChainId: XChainId) {
  const { hubChainId, sodax } = useSodaxContext();
  const hubWalletProvider = useWalletProvider(hubChainId);
  const hubProvider = useHubProvider();
  const { address } = useXAccount(getXChainType(spokeChainId));
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
