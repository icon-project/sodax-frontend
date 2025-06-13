import type { Address } from 'viem';
import { walletFactoryAbi } from '../../abis/index.js';
import type { EvmHubProvider } from '../../entities/index.js';
import { type Hex, getIntentRelayChainId } from '../../index.js';
import type { SpokeChainId } from '@sodax/types';

export class EvmWalletAbstraction {
  private constructor() {}

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
