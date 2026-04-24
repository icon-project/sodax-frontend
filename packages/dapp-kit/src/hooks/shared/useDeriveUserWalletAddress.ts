import { HubService } from '@sodax/sdk';
import type { SpokeChainKey } from '@sodax/types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from './useSodaxContext.js';
import type { Address } from 'viem';

export function useDeriveUserWalletAddress(
  spokeChainId?: SpokeChainKey | undefined,
  spokeAddress?: string | undefined,
): UseQueryResult<Address, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['deriveUserWalletAddress', spokeChainId, spokeAddress],
    queryFn: async (): Promise<Address> => {
      if (!spokeChainId || !spokeAddress) {
        throw new Error('Spoke chain id and address are required');
      }
      return await HubService.getUserHubWalletAddress(spokeAddress, spokeChainId, sodax.hubProvider);
    },
    enabled: !!spokeChainId && !!spokeAddress,
    refetchInterval: false,
  });
}
