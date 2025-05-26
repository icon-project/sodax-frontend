import {
  AVALANCHE_FUJI_TESTNET_CHAIN_ID,
  type EvmHubProvider,
  EvmWalletAbstraction,
  SONIC_TESTNET_CHAIN_ID,
} from '@new-world/sdk';
import type { XChainId } from '@new-world/xwagmi';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

// TODO: complete this map
export const sdkChainIdMap = {
  '0xa869.fuji': AVALANCHE_FUJI_TESTNET_CHAIN_ID,
  'sonic-blaze': SONIC_TESTNET_CHAIN_ID,
};

export function useHubWalletAddress(
  spokeChainId: XChainId,
  address: string | undefined,
  hubProvider: EvmHubProvider,
): UseQueryResult<string | null> {
  return useQuery({
    queryKey: ['hubWallet', spokeChainId, address],
    queryFn: async () => {
      if (!address) return null;

      const hubWalletAddress = await EvmWalletAbstraction.getUserHubWalletAddress(
        sdkChainIdMap[spokeChainId],
        address as `0x${string}`,
        hubProvider,
      );
      return hubWalletAddress;
    },
    enabled: !!address && !!hubProvider,
  });
}
