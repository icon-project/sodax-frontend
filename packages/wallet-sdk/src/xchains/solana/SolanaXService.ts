import { XService } from '@/core/XService';
import { isNativeToken } from '@/utils';
import type { XToken } from '@sodax/types';
import { PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';

export class SolanaXService extends XService {
  private static instance: SolanaXService;

  public connection: any;
  public wallet: any;
  public provider: any;

  private constructor() {
    super('SOLANA');
  }

  public static getInstance(): SolanaXService {
    if (!SolanaXService.instance) {
      SolanaXService.instance = new SolanaXService();
    }
    return SolanaXService.instance;
  }

  async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    if (!address) return BigInt(0);

    const connection = this.connection;

    try {
      if (isNativeToken(xToken)) {
        const newBalance = await connection.getBalance(new PublicKey(address));
        return BigInt(newBalance);
      }

      const tokenAccountPubkey = getAssociatedTokenAddressSync(new PublicKey(xToken.address), new PublicKey(address));
      const tokenAccount = await getAccount(connection, tokenAccountPubkey);
      return BigInt(tokenAccount.amount);
    } catch (e) {
      console.log('error', e);
    }

    return BigInt(0);
  }
}
