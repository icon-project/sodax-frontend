import { walletFactoryAbi } from '../../abis/index.js';
import type { EvmHubProvider } from '../../entities/index.js';
import { getIntentRelayChainId } from '../../index.js';
import type { EvmAddress, SpokeChainId } from '@sodax/types';

export class EvmWalletAbstraction {
  private constructor() {}

  public static async getUserHubWalletAddress(
    chainId: SpokeChainId,
    address: EvmAddress,
    hubProvider: EvmHubProvider,
  ): Promise<EvmAddress> {
    return hubProvider.publicClient.readContract({
      address: hubProvider.chainConfig.addresses.hubWallet,
      abi: walletFactoryAbi,
      functionName: 'getDeployedAddress',
      args: [BigInt(getIntentRelayChainId(chainId)), address],
    });
  }
}
