import type { Address } from '@sodax/types';
import { SonicSpokeProvider, type EvmHubProvider, type SpokeProvider } from '../../entities/index.js';
import { encodeAddress, EvmWalletAbstraction, SonicSpokeService } from '../../index.js';

/**
 * Service to get valid hub wallet address which may differ based on the spoke chain.
 */
export class WalletAbstractionService {
  private constructor() {}

  /**
   * Gets the hub wallet address for a user based on their spoke chain address.
   * @param address - The user's address on the spoke chain
   * @param spokeProvider - The provider for interacting with the spoke chain
   * @param hubProvider - The provider for interacting with the hub chain
   * @returns The user's hub wallet address
   */
  public static async getUserHubWalletAddress(
    address: string,
    spokeProvider: SpokeProvider,
    hubProvider: EvmHubProvider,
  ): Promise<Address> {
    const encodedAddress = encodeAddress(spokeProvider.chainConfig.chain.id, address);
    // if spoke chain id is the same as the hub chain id, use the user router (sonic)
    if (spokeProvider.chainConfig.chain.id === hubProvider.chainConfig.chain.id) {
      if (spokeProvider instanceof SonicSpokeProvider) {
        return SonicSpokeService.getUserRouter(encodedAddress, spokeProvider);
      }

      throw new Error(
        '[WalletAbstractionService.getUserHubWalletAddress] Invalid spoke provider. Sonic spoke provider is required.',
      );
    }

    return EvmWalletAbstraction.getUserHubWalletAddress(
      spokeProvider.chainConfig.chain.id,
      encodedAddress,
      hubProvider,
    );
  }
}
