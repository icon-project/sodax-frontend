import { XService } from '@/core/XService';
import { isNativeToken } from '@/utils';
import type { XToken } from '@sodax/types';
import { type Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';
import type { AnchorProvider } from '@coral-xyz/anchor';
import type { WalletContextState } from '@solana/wallet-adapter-react';

export class SolanaXService extends XService {
  private static instance: SolanaXService;

  public connection: Connection | undefined;
  public wallet: WalletContextState | undefined;
  public provider: AnchorProvider | undefined;

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
    if (!connection) {
      throw new Error('Connection is not initialized');
    }

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
