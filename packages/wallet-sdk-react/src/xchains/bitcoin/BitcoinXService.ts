import { XService } from '@/core/XService';
import { isNativeToken } from '@/utils';
import type { XToken } from '@sodax/types';

export class BitcoinXService extends XService {
  private static instance: BitcoinXService;
  private rpcUrl: string;

  private constructor(rpcUrl = 'https://mempool.space/api') {
    super('BITCOIN');
    this.rpcUrl = rpcUrl;
  }

  public static getInstance(rpcUrl?: string): BitcoinXService {
    if (!BitcoinXService.instance) {
      BitcoinXService.instance = new BitcoinXService(rpcUrl);
    }
    return BitcoinXService.instance;
  }

  async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    if (!address) return 0n;

    try {
      if (isNativeToken(xToken)) {
        const response = await fetch(`${this.rpcUrl}/address/${address}/utxo`);
        if (!response.ok) return 0n;
        const utxos: Array<{ value: number; status: { confirmed: boolean } }> = await response.json();
        const confirmedBalance = utxos
          .filter(utxo => utxo.status.confirmed)
          .reduce((sum, utxo) => sum + utxo.value, 0);
        return BigInt(confirmedBalance);
      }
    } catch {
      return 0n;
    }

    return 0n;
  }
}
