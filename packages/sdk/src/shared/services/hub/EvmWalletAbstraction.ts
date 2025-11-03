import type { Address } from 'viem';
import { walletFactoryAbi } from '../../abis/index.js';
import type { EvmHubProvider } from '../../entities/index.js';
import { type SpokeChainId, getIntentRelayChainId, type Hex } from '@sodax/types';

export class EvmWalletAbstraction {
  private constructor() {}

  /**
   * Get the hub wallet address for a given spoke chain and address.
   * @param chainId - The spoke chain ID.
   * @param address - The address on the spoke chain.
   * @param hubProvider - The hub provider.
   * @returns The hub wallet address.
   */
  public static async getUserHubWalletAddress(
    chainId: SpokeChainId,
    address: Hex,
    hubProvider: EvmHubProvider,
  ): Promise<Address> {
    return hubProvider.publicClient.readContract({
      address: hubProvider.chainConfig.addresses.hubWallet,
      abi: walletFactoryAbi,
      functionName: 'getDeployedAddress',
      args: [BigInt(getIntentRelayChainId(chainId)), address],
    });
  }
}
