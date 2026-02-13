import { useXService } from '@/hooks';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { NearXConnector } from './NearXConnector';
import type { NearXService } from './NearXService';

export const useNearXConnectors = (): UseQueryResult<NearXConnector[] | undefined, Error | null> => {
  const xService = useXService('NEAR') as NearXService;

  return useQuery({
    queryKey: ['near-wallets'],
    queryFn: async () => {
      if (!xService) {
        return [];
      }

      await xService.walletSelector.whenManifestLoaded;
      const wallets = xService.walletSelector.availableWallets;

      return wallets.map(wallet => new NearXConnector(wallet));
    },
  });
};
