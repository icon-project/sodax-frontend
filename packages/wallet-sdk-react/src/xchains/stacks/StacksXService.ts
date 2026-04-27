import { XService } from '@/core/XService.js';
import type { XToken } from '@sodax/types';
import { fetchCallReadOnlyFunction, Cl, type UIntCV, type ResponseOkCV } from '@stacks/transactions';
import { networkFrom, type StacksNetwork, type StacksNetworkName } from '@stacks/network';

export class StacksXService extends XService {
  private static instance: StacksXService;

  public network: StacksNetwork;

  private constructor(network?: StacksNetworkName | StacksNetwork) {
    super('STACKS');
    this.network = networkFrom(network || 'mainnet');
  }

  /**
   * @param network - Re-applied on every call (unlike `InjectiveXService` /
   *   `NearXService` which are first-call-only). `useStacksHydration` relies
   *   on this to update the network when `rpcConfig.stacks` changes — Stacks
   *   doesn't hold persistent chain clients so re-configuration is cheap.
   */
  public static getInstance(network?: StacksNetworkName | StacksNetwork): StacksXService {
    if (!StacksXService.instance) {
      StacksXService.instance = new StacksXService(network);
    } else if (network) {
      StacksXService.instance.network = networkFrom(network);
    }
    return StacksXService.instance;
  }

  override async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    if (!address) return 0n;

    // native STX balance
    if (xToken.symbol === 'STX') {
      const url = `${this.network.client.baseUrl}/extended/v1/address/${address}/balances`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }
        const data = await response.json();
        return BigInt(data.stx.balance);
      } catch (error) {
        console.error('Error fetching STX balance:', error);
        return 0n;
      }
    }

    // SIP-010 fungible token balance via read-only contract call
    const parts = xToken.address.split('.');
    const contractAddress = parts[0] ?? '';
    const contractName = parts[1] ?? '';
    try {
      const result = (await fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-balance',
        functionArgs: [Cl.principal(address)],
        network: this.network,
        senderAddress: address,
      })) as ResponseOkCV<UIntCV>;
      return result.value.value as bigint;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0n;
    }
  }
}
