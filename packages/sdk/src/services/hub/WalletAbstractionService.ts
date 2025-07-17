import type { Address, Hex, SpokeChainId } from '@sodax/types';
import { SonicSpokeProvider, type EvmHubProvider, type SpokeProvider } from '../../entities/index.js';
import { EvmWalletAbstraction, SonicSpokeService } from '../../index.js';

/**
 * Service to get valid hub wallet address which may differ based on the spoke chain.
 */
export class WalletAbstractionService {
  private constructor() {}

  public static async getUserHubWalletAddress(
    chainId: SpokeChainId,
    address: Hex,
    hubProvider: EvmHubProvider,
    spokeProvider: SpokeProvider,
  ): Promise<Address> {
    // if chainId is the same as the hub chain id, use the user router (sonic)
    if (chainId === hubProvider.chainConfig.chain.id) {
      if (spokeProvider instanceof SonicSpokeProvider) {
        return SonicSpokeService.getUserRouter(address, spokeProvider);
      }

      throw new Error(
        '[WalletAbstractionService.getUserHubWalletAddress] Invalid spoke provider. Sonic spoke provider is required.',
      );
    }

    return EvmWalletAbstraction.getUserHubWalletAddress(chainId, address, hubProvider);
  }
}
