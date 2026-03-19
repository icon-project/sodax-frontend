import { XService } from '@/core/XService';
import type { XToken } from '@sodax/types';
import { Network } from '@provablehq/aleo-types';

import { AleoNetworkClient, BHP256, Plaintext } from '@provablehq/sdk';
import { isNativeToken } from '../../utils';

export class AleoXService extends XService {
  private static instance: AleoXService;
  public network: Network = Network.MAINNET;

  public networkClient: AleoNetworkClient;
  public rpcUrl = 'https://api.provable.com/v2';

  private constructor() {
    super('ALEO');
    this.networkClient = new AleoNetworkClient(this.rpcUrl);
  }

  public static getInstance(): AleoXService {
    if (!AleoXService.instance) {
      AleoXService.instance = new AleoXService();
    }
    return AleoXService.instance;
  }

  public setNetworkClient(network: Network): void {
    this.rpcUrl =
      network === Network.MAINNET ? 'https://api.provable.com/v2' : 'https://api.provable.com/v2';

    this.networkClient = new AleoNetworkClient(this.rpcUrl);
  }

  async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    if (!address) return 0n;

    try {
      if (isNativeToken(xToken)) {
        const mapping = await this.networkClient.getProgramMappingValue('credits.aleo', 'account', address);

        if (mapping) {
          const valueStr = mapping.toString().replace('u64', '');
          return BigInt(valueStr);
        }

        return 0n;
      }
      const bhp = new BHP256();
      const structLiteral = `{ account: ${address}, token_id: ${xToken.address}field }`;
      const plaintext = Plaintext.fromString(structLiteral);
      const key = bhp.hash(plaintext.toBitsLe()).toString();
      const result = await this.networkClient.getProgramMappingValue('token_registry.aleo', 'authorized_balances', key);
      if (result == null) return 0n;
      const match = result.match(/balance:\s*(\d+)u128/);
      return match?.[1] != null ? BigInt(match[1]) : 0n;
    } catch (e) {
      console.log('error AleoService: ', e);
      return BigInt(0);
    }
  }
}
