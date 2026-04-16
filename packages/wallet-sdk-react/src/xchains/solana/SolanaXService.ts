import { XService } from '@/core/XService.js';
import { isNativeToken } from '@/utils/index.js';
import type { XToken } from '@sodax/types';
import { type Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';
import type { WalletContextState } from '@solana/wallet-adapter-react';

export class SolanaXService extends XService {
  private static instance: SolanaXService;

  public connection: Connection | undefined;
  public wallet: WalletContextState | undefined;

  private constructor() {
    super('SOLANA');
  }

  public static getInstance(): SolanaXService {
    if (!SolanaXService.instance) {
      SolanaXService.instance = new SolanaXService();
    }
    return SolanaXService.instance;
  }

  override async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    if (!address) return BigInt(0);

    const connection = this.connection;
    if (!connection) {
      return BigInt(0);
    }

    try {
      if (isNativeToken(xToken)) {
        const newBalance = await connection.getBalance(new PublicKey(address));
        return BigInt(newBalance);
      }

      const tokenAccountPubkey = getAssociatedTokenAddressSync(new PublicKey(xToken.address), new PublicKey(address));
      const tokenAccount = await getAccount(connection, tokenAccountPubkey);
      return BigInt(tokenAccount.amount);
    } catch {
      return BigInt(0);
    }
  }
}
