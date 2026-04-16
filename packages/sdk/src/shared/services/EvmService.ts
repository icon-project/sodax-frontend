import type { EvmChainKey, HttpUrl, SonicChainKey } from '@sodax/types';
import { createPublicClient, type PublicClient, http } from 'viem';
import { getEvmViemChain } from '../constants.js';

export type CreateViemPublicClientParams = {
  chainId: EvmChainKey | SonicChainKey;
  rpcUrl?: HttpUrl;
};

export class EvmService {
  private constructor() {}

  public static async getPublicClient({ chainId, rpcUrl }: CreateViemPublicClientParams): Promise<PublicClient> {
    if (rpcUrl) {
      return createPublicClient({
        transport: http(rpcUrl),
        chain: getEvmViemChain(chainId),
      });
    }
    return createPublicClient({
      transport: http(getEvmViemChain(chainId).rpcUrls.default.http[0]),
      chain: getEvmViemChain(chainId),
    });
  }
}
