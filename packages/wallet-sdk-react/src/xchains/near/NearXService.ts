import { XService } from '@/core/XService';
import type { XToken } from '@sodax/types';
import { NearConnector } from '@hot-labs/near-connect';
import { JsonRpcProvider } from '@near-js/providers';

export class NearXService extends XService {
  private static instance: NearXService;

  public walletSelector: NearConnector;

  private constructor() {
    super('STELLAR');

    this.walletSelector = new NearConnector({
      network: 'testnet',
      logger: console,
      autoConnect: true,
    });
  }

  public static getInstance(): NearXService {
    if (!NearXService.instance) {
      NearXService.instance = new NearXService();
    }
    return NearXService.instance;
  }

  async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    const url = 'https://rpc.testnet.near.org';
    // reference: https://near.github.io/near-api-js/classes/_near-js_providers.json-rpc-provider.JsonRpcProvider.html
    const provider = new JsonRpcProvider({ url });

    // get native balance
    if (xToken.symbol === 'NEAR') {
      const account = await provider.viewAccount(address ?? '');
      console.log(account, address);
      return BigInt(account.amount);
    }

    // Near Fungible Token Standard(https://github.com/near/NEPs/blob/master/neps/nep-0141.md)
    // get balance of the token

    const res = await provider.callFunction<number>(xToken.address, 'ft_balance_of', { account_id: address });
    return BigInt(res ?? 0);
  }
}
