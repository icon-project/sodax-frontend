import { useXService } from '@/hooks';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { StellarWalletsKitXConnector, type StellarXService } from '.';

export const useStellarXConnectors = (): UseQueryResult<StellarWalletsKitXConnector[] | undefined, Error | null> => {
  const xService = useXService('STELLAR') as StellarXService;

  return useQuery({
    queryKey: ['stellar-wallets', xService],
    queryFn: async () => {
      if (!xService) {
        return [];
      }

      const wallets = await xService.walletsKit.getSupportedWallets();

      return wallets.filter(wallet => wallet.isAvailable).map(wallet => new StellarWalletsKitXConnector(wallet));
    },
  });
};
