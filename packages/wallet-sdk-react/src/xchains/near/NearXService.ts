import { XService } from '@/core/XService.js';
import type { XToken } from '@sodax/types';
import { NearConnector } from '@hot-labs/near-connect';
import { JsonRpcProvider } from 'near-api-js';
import { NEAR_DEFAULT_RPC_URL } from '@/constants.js';

export class NearXService extends XService {
  private static instance: NearXService;

  public walletSelector: NearConnector;
  private rpcUrl: string;

  /**
   * @param rpcUrl - Used by `getBalance` via `JsonRpcProvider({ url: rpcUrl })`.
   *   Does NOT affect `walletSelector` — `@hot-labs/near-connect` only accepts
   *   the network preset name (`'mainnet'`/`'testnet'`) and fetches RPC internally.
   *   Custom RPC is therefore read-only for balance queries.
   */
  private constructor(rpcUrl: string = NEAR_DEFAULT_RPC_URL) {
    super('NEAR');

    this.rpcUrl = rpcUrl;
    this.walletSelector = new NearConnector({
      network: 'mainnet',
      logger: console,
      autoConnect: true,
      excludedWallets: ['okx-wallet'],
    });
  }

  /**
   * @param rpcUrl - Only applied on first call (matches InjectiveXService
   *   semantics). Subsequent calls return the existing instance unchanged.
   *   Pass the desired RPC via `SodaxWalletProvider.config.rpcConfig` once
   *   at app init.
   */
  public static getInstance(rpcUrl?: string): NearXService {
    if (!NearXService.instance) {
      NearXService.instance = new NearXService(rpcUrl);
    }
    return NearXService.instance;
  }

  override async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    // reference: https://near.github.io/near-api-js/classes/_near-js_providers.json-rpc-provider.JsonRpcProvider.html
    const provider = new JsonRpcProvider({ url: this.rpcUrl });

    // get native balance
    if (xToken.symbol === 'NEAR') {
      const account = await provider.viewAccount({ accountId: address ?? '' });
      return BigInt(account.amount);
    }

    // Near Fungible Token Standard(https://github.com/near/NEPs/blob/master/neps/nep-0141.md)
    // get balance of the token

    const res = await provider.callFunction<number>({ contractId: xToken.address, method: 'ft_balance_of', args: { account_id: address } });
    return BigInt(res ?? 0);
  }
}
