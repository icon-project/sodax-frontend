import {
  AVALANCHE_FUJI_TESTNET_CHAIN_ID,
  type EvmHubProvider,
  EvmWalletAbstraction,
  SONIC_TESTNET_CHAIN_ID,
} from '@new-world/sdk';
import type { XChainId } from '@new-world/xwagmi';
import { useQuery } from '@tanstack/react-query';

// TODO: complete this map
export const sdkChainIdMap = {
  '0xa869.fuji': AVALANCHE_FUJI_TESTNET_CHAIN_ID,
  'sonic-blaze': SONIC_TESTNET_CHAIN_ID,
};

export function useHubWallet(xChainId: XChainId, address: string | undefined, hubProvider: EvmHubProvider) {
  return useQuery({
    queryKey: ['hubWallet', xChainId, address],
    queryFn: async () => {
      if (!address) return null;

      const hubWallet = await EvmWalletAbstraction.getUserWallet(
        // @ts-ignore
        BigInt(sdkChainIdMap[xChainId]),
        address as `0x${string}`,
        hubProvider,
      );
      return hubWallet;
    },
    enabled: !!address && !!hubProvider,
  });
}
