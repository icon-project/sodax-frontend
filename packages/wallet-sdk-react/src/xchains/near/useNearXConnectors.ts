import { useXService } from '@/hooks/index.js';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { NearXConnector } from './NearXConnector.js';
import { NearXService } from './NearXService.js';

export const useNearXConnectors = (): UseQueryResult<NearXConnector[] | undefined, Error | null> => {
  const xService = useXService('NEAR');

  return useQuery({
    queryKey: ['near-wallets'],
    queryFn: async () => {
      if (!(xService instanceof NearXService)) {
        return [];
      }

      await xService.walletSelector.whenManifestLoaded;
      const wallets = xService.walletSelector.availableWallets;

      return wallets.map(wallet => new NearXConnector(wallet));
    },
  });
};
