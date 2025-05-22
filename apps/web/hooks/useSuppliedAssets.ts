import { allXTokens, moneyMarket, moneyMarketConfig, sonicBlazeTestnet } from '@/app/config';
import type { EvmHubProvider } from '@new-world/sdk';
import { getXChainType, useXAccount } from '@new-world/xwagmi';
import { useQuery } from '@tanstack/react-query';
import type { Address, HttpTransport, PublicClient } from 'viem';
import { usePublicClient } from 'wagmi';
import { useHubProvider } from './useHubProvider';
import { useHubWallet } from './useHubWallet';

export default function useSuppliedAssets() {
  const { address } = useXAccount(getXChainType('0xa869.fuji'));
  const hubProvider = useHubProvider('sonic-blaze');
  const { data: hubWallet } = useHubWallet('0xa869.fuji', address, hubProvider as EvmHubProvider);

  const sonicTestnetPublicClient = usePublicClient({
    chainId: sonicBlazeTestnet.id,
  }) as PublicClient<HttpTransport> | undefined;

  const { data: userReserves } = useQuery({
    queryKey: ['userReserves', hubWallet],
    queryFn: async () => {
      if (!sonicTestnetPublicClient) {
        return;
      }

      const [res] = await moneyMarket.getUserReservesData(
        hubWallet as Address,
        moneyMarketConfig.uiPoolDataProvider as Address,
        moneyMarketConfig.poolAddressesProvider as Address,
        sonicTestnetPublicClient,
      );

      return res?.map(r => {
        return {
          ...r,
          token: allXTokens.find(t => t.address === r.underlyingAsset),
        };
      });
    },
    enabled: !!address && !!sonicTestnetPublicClient,
    refetchInterval: 5000,
  });

  return userReserves;
}
