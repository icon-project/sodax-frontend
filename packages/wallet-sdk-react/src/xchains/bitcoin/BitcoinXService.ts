import { XService } from '@/core/XService.js';
import { isNativeToken } from '@/utils/index.js';
import type { XToken } from '@sodax/types';
import { BITCOIN_DEFAULT_RPC_URL } from '@/constants.js';

export class BitcoinXService extends XService {
  private static instance: BitcoinXService;
  private rpcUrl: string;

  private constructor(rpcUrl = BITCOIN_DEFAULT_RPC_URL) {
    super('BITCOIN');
    this.rpcUrl = rpcUrl;
  }

  public static getInstance(rpcUrl?: string): BitcoinXService {
    if (!BitcoinXService.instance) {
      BitcoinXService.instance = new BitcoinXService(rpcUrl);
    } else if (rpcUrl && rpcUrl !== BitcoinXService.instance.rpcUrl) {
      BitcoinXService.instance.rpcUrl = rpcUrl;
    }
    return BitcoinXService.instance;
  }

  override async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    if (!address) return 0n;

    try {
      if (isNativeToken(xToken)) {
        const response = await fetch(`${this.rpcUrl}/address/${address}/utxo`);
        if (!response.ok) return 0n;
        const utxos: Array<{ value: number }> = await response.json();
        const totalBalance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
        return BigInt(totalBalance);
      }
    } catch {
      return 0n;
    }

    return 0n;
  }
}
