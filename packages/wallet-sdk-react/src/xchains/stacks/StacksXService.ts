import { XService } from '@/core/XService.js';
import type { XToken } from '@sodax/types';
import { fetchCallReadOnlyFunction, Cl, type UIntCV, type ResponseOkCV } from '@stacks/transactions';
import { networkFrom, type StacksNetwork } from '@stacks/network';

export class StacksXService extends XService {
  private static instance: StacksXService;

  public network: StacksNetwork | undefined;

  private constructor() {
    super('STACKS');
    this.network = networkFrom('mainnet');
  }

  public static getInstance(): StacksXService {
    if (!StacksXService.instance) {
      StacksXService.instance = new StacksXService();
    }
    return StacksXService.instance;
  }

  override async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    if (!address) return 0n;

    // native STX balance
    if (xToken.symbol === 'STX') {
      const url = `${this.network?.client.baseUrl}/extended/v1/address/${address}/balances`;
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
