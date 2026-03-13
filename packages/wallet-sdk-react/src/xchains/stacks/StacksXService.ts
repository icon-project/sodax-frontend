import { XService } from '@/core/XService';
import type { XToken } from '@sodax/types';
import { fetchCallReadOnlyFunction, Cl, type UIntCV, type ResponseOkCV } from '@stacks/transactions';
import { networkFrom } from '@stacks/network';

const STACKS_API_BASE_URL = 'https://api.mainnet.hiro.so';

export class StacksXService extends XService {
  private static instance: StacksXService;

  private constructor() {
    super('STACKS');
  }

  public static getInstance(): StacksXService {
    if (!StacksXService.instance) {
      StacksXService.instance = new StacksXService();
    }
    return StacksXService.instance;
  }

  async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    if (!address) return 0n;

    // native STX balance
    if (xToken.symbol === 'STX') {
      const url = `${STACKS_API_BASE_URL}/extended/v1/address/${address}/balances`;
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
    const [contractAddress, contractName] = xToken.address.split('.');
    try {
      const result = (await fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-balance',
        functionArgs: [Cl.principal(address)],
        network: networkFrom('mainnet'),
        senderAddress: address,
      })) as ResponseOkCV<UIntCV>;
      return result.value.value as bigint;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0n;
    }
  }
}
