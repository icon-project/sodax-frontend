import { type EvmHubProvider, EvmWalletAbstraction } from '@sodax/sdk';
import type { SpokeChainId } from '@sodax/types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

export function useHubWalletAddress(
  spokeChainId: SpokeChainId,
  address: string | undefined,
  hubProvider: EvmHubProvider,
): UseQueryResult<string | null> {
  return useQuery({
    queryKey: ['hubWallet', spokeChainId, address],
    queryFn: async () => {
      if (!address) return null;

      try {
        const hubWalletAddress = await EvmWalletAbstraction.getUserHubWalletAddress(
          spokeChainId,
          address as `0x${string}`,
          hubProvider,
        );
        return hubWalletAddress;
      } catch (error) {
        console.log('error', error);
        return null;
      }
    },
    enabled: !!address && !!hubProvider,
  });
}
