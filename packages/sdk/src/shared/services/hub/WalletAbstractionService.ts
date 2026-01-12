import type { Address } from '@sodax/types';
import { SonicSpokeProvider, type EvmHubProvider, type SpokeProviderType } from '../../entities/index.js';
import { encodeAddress } from '../../utils/shared-utils.js';
import { EvmWalletAbstraction } from './EvmWalletAbstraction.js';
import { isSonicRawSpokeProvider } from '../../guards.js';
import { SonicSpokeService } from '../spoke/SonicSpokeService.js';

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
  public static async getUserAbstractedWalletAddress(
    address: string,
    spokeProvider: SpokeProviderType,
    hubProvider: EvmHubProvider,
  ): Promise<Address> {
    const encodedAddress = encodeAddress(spokeProvider.chainConfig.chain.id, address);
    // if spoke chain id is the same as the hub chain id, use the user router (sonic)
    if (spokeProvider.chainConfig.chain.id === hubProvider.chainConfig.chain.id) {
      if (spokeProvider instanceof SonicSpokeProvider || isSonicRawSpokeProvider(spokeProvider)) {
        return SonicSpokeService.getUserRouter(encodedAddress, spokeProvider);
      }

      throw new Error(
        '[getUserHubWalletAddress] Invalid spoke provider for matching hub id. Sonic spoke provider is required.',
      );
    }

    return EvmWalletAbstraction.getUserHubWalletAddress(
      spokeProvider.chainConfig.chain.id,
      encodedAddress,
      hubProvider,
    );
  }
}
