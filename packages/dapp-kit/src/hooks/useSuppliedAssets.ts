import { allXTokens } from '@/core';
import { getMoneyMarketConfig, type EvmHubProvider } from '@new-world/sdk';
import { getXChainType, useXAccount } from '@new-world/xwagmi';
import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { useHubProvider } from './useHubProvider';
import { useHubWallet } from './useHubWallet';
import { useWalletProvider } from './useWalletProvider';
import { useSodaxContext } from './useSodaxContext';

export function useSuppliedAssets() {
  const { hubChainId, sodax } = useSodaxContext();
  const hubWalletProvider = useWalletProvider(hubChainId);
  const hubProvider = useHubProvider();
  const { address } = useXAccount(getXChainType('0xa869.fuji'));
  const { data: hubWallet } = useHubWallet('0xa869.fuji', address, hubProvider as EvmHubProvider);

  const { data: userReserves } = useQuery({
    queryKey: ['userReserves', hubWallet],
    queryFn: async () => {
      if (!hubWalletProvider) {
        return;
      }

      const moneyMarketConfig = getMoneyMarketConfig(hubChainId);
      try {
        const [res] = await sodax.moneyMarket.getUserReservesData(
          hubWallet as Address,
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
    enabled: !!address && !!hubWalletProvider,
    refetchInterval: 5000,
  });

  return userReserves;
}
