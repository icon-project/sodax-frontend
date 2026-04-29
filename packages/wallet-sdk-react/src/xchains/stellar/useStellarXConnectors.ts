import { useXService } from '@/hooks/index.js';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { StellarWalletsKitXConnector, StellarXService } from './index.js';
import type { StellarWalletType } from './StellarWalletsKitXConnector.js';

export const useStellarXConnectors = (): UseQueryResult<StellarWalletsKitXConnector[] | undefined, Error | null> => {
  const xService = useXService('STELLAR');

  return useQuery({
    queryKey: ['stellar-wallets', xService],
    queryFn: async () => {
      if (!(xService instanceof StellarXService)) {
        return [];
      }

      const wallets = await xService.walletsKit.getSupportedWallets();

      return wallets
        .filter((wallet: StellarWalletType) => wallet.isAvailable)
        .map((wallet: StellarWalletType) => new StellarWalletsKitXConnector(wallet));
    },
  });
};
