import type { XAccount } from '@/types';
// Wallet is the type from useWallet().wallets — each entry has .adapter (name, icon) and .readyState.
import type { Wallet } from '@solana/wallet-adapter-react';

import { XConnector } from '@/core';
import { SolanaXService } from './SolanaXService';

export class SolanaXConnector extends XConnector {
  wallet: Wallet;
  constructor(wallet: Wallet) {
    super('SOLANA', wallet?.adapter.name, wallet?.adapter.name);
    this.wallet = wallet;
  }

  getXService(): SolanaXService {
    return SolanaXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    return;
  }

  async disconnect(): Promise<void> {}

  public get icon() {
    return this.wallet?.adapter.icon;
  }
}
