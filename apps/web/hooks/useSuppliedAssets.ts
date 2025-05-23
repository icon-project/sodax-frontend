import { allXTokens, moneyMarket, moneyMarketConfig } from '@/app/config';
import type { EvmHubProvider } from '@new-world/sdk';
import { getXChainType, useXAccount } from '@new-world/xwagmi';
import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { useHubProvider } from './useHubProvider';
import { useHubWallet } from './useHubWallet';
import { useWalletProvider } from './useWalletProvider';
export default function useSuppliedAssets() {
  const { address } = useXAccount(getXChainType('0xa869.fuji'));
  const hubWalletProvider = useWalletProvider('0xa869.fuji');
  const hubProvider = useHubProvider('sonic-blaze');
  const { data: hubWallet } = useHubWallet('0xa869.fuji', address, hubProvider as EvmHubProvider);

  const { data: userReserves } = useQuery({
    queryKey: ['userReserves', hubWallet],
    queryFn: async () => {
      if (!hubWalletProvider) {
        return;
      }

      const [res] = await moneyMarket.getUserReservesData(
        hubWallet as Address,
        moneyMarketConfig.uiPoolDataProvider as Address,
        moneyMarketConfig.poolAddressesProvider as Address,
        hubWalletProvider,
      );

      return res?.map(r => {
        return {
          ...r,
          token: allXTokens.find(t => t.address === r.underlyingAsset),
        };
      });
    },
    enabled: !!address && !!hubWalletProvider,
    refetchInterval: 5000,
  });

  return userReserves;
}
