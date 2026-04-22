import type { XAccount } from '@/types/index.js';
// Wallet is the type from useWallet().wallets — each entry has .adapter (name, icon, url) and .readyState.
import type { Wallet } from '@solana/wallet-adapter-react';

import { XConnector } from '@/core/index.js';
import { SolanaXService } from './SolanaXService.js';

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

  public override get icon(): string {
    return this.wallet?.adapter.icon;
  }

  public override get isInstalled(): boolean {
    // WalletReadyState string values from @solana/wallet-adapter-base.
    // Imported as string literals to avoid adding -base as an explicit dep.
    const state = this.wallet?.readyState as string | undefined;
    return state === 'Installed' || state === 'Loadable';
  }

  public override get installUrl(): string | undefined {
    return this.wallet?.adapter.url;
  }
}
