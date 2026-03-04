import { sonicWalletFactoryAbi } from '../../abis/sonicWalletFactory.abi.js';
import type { Address, ChainId, HubAddress } from '@sodax/types';
import type { EvmHubProvider } from '../../entities/index.js';
import { encodeAddress } from '../../utils/shared-utils.js';
import { EvmWalletAbstraction } from './EvmWalletAbstraction.js';
/**
 * HubService is a main class that provides functionalities for dealing with hub chains.
 */
export class HubService {
  private constructor() {}

  /**
   * Get the derived address of a contract deployed with CREATE3.
   * @param address - User's address on the specified chain as hex
   * @param hubProvider - Hub provider
   * @returns {HubAddress} The computed contract address as a EVM address (hex) string
   */
  public static async getUserRouter(address: Address, hubProvider: EvmHubProvider): Promise<HubAddress> {
    return hubProvider.publicClient.readContract({
      address: hubProvider.chainConfig.addresses.walletRouter,
      abi: sonicWalletFactoryAbi,
      functionName: 'getDeployedAddress',
      args: [address],
    });
  }

  /**
   * Gets the hub wallet address for a user based on their spoke chain address.
   * @param address - The user's address on the spoke chain
   * @param chainId - spoke chain id
   * @param hubProvider - The provider for interacting with the hub chain
   * @returns The user's hub wallet address
   */
  public static async getUserHubWalletAddress(
    address: string,
    chainId: ChainId,
    hubProvider: EvmHubProvider,
  ): Promise<Address> {
    const encodedAddress = encodeAddress(chainId, address);

    // for hub chain, use the user router instead of CREATE3
    if (chainId === hubProvider.chainConfig.chain.id) {
      return HubService.getUserRouter(encodedAddress, hubProvider);
    }

    return EvmWalletAbstraction.getUserHubWalletAddress(
      chainId,
      encodedAddress,
      hubProvider,
    );
  }
}
